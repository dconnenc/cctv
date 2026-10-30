module Minigames
  module Fishy
    # Authoritative Fishy physics. Pure Ruby over a JSON-serializable state hash
    # so the tick job can persist it to Redis between ticks and resume after a
    # restart. Players are addressed by roster slot.
    class Simulation
      Result = Struct.new(:changed, :eliminated, :pellets, keyword_init: true)

      SPAWN_MIN_DISTANCE = Config::START_RADIUS * 4
      SPAWN_ATTEMPTS     = 50
      PELLET_CELL_SIZE   = 200.0
      REST_SPEED         = 0.5

      attr_reader :state

      def self.seed(slot_count:, started_at:, rng: Random.new)
        players = spawn_points(slot_count, rng).each_with_index.map do |(x, y), slot|
          {
            "slot"          => slot,
            "x"             => x,
            "y"             => y,
            "vx"            => 0.0,
            "vy"            => 0.0,
            "size"          => 1.0,
            "alive"         => true,
            "eaten_by"      => nil,
            "dash_dx"       => 0.0,
            "dash_dy"       => 0.0,
            "dash_until"    => 0.0,
            "dash_ready_at" => 0.0
          }
        end

        pellets = Array.new(Config.pellet_count(slot_count)) { random_point(rng) }

        {
          "started_at"   => started_at,
          "tick"         => 0,
          "elapsed"      => 0.0,
          "players"      => players,
          "pellets"      => pellets,
          "eliminations" => []
        }
      end

      def self.random_point(rng)
        margin = Config::PELLET_RADIUS
        span   = Config::WORLD_SIZE - (margin * 2)
        [margin + (rng.rand * span), margin + (rng.rand * span)]
      end

      def self.spawn_points(count, rng)
        span   = Config::WORLD_SIZE - (Config::SPAWN_MARGIN * 2)
        points = []

        count.times do
          candidate = nil
          SPAWN_ATTEMPTS.times do
            candidate = [Config::SPAWN_MARGIN + (rng.rand * span), Config::SPAWN_MARGIN + (rng.rand * span)]
            break if points.none? { |px, py| Math.hypot(px - candidate[0], py - candidate[1]) < SPAWN_MIN_DISTANCE }
          end
          points << candidate
        end

        points
      end

      def initialize(state, rng: Random.new)
        @state = state
        @rng   = rng
      end

      def started_at
        state["started_at"]
      end

      def tick
        state["tick"]
      end

      def elapsed
        state["elapsed"]
      end

      def players
        state["players"]
      end

      def alive_players
        players.select { |p| p["alive"] }
      end

      def finished?
        alive_players.size <= 1
      end

      # @param inputs [Hash{Integer => Array(Float, Float)}] slot => unit direction; absent = finger lifted
      # @param dashes [Hash{Integer => Array(Float, Float)}] slot => requested dash direction
      def step(dt, inputs: {}, dashes: {})
        dt = dt.to_f.clamp(0.0, Config::MAX_STEP_SECONDS)
        state["tick"] += 1
        state["elapsed"] += dt
        now = elapsed

        dashed = apply_dashes(dashes, now)
        moved  = alive_players.map { |p| move(p, inputs[p["slot"]], dt, now) }.any?

        pellet_changes = eat_pellets
        eliminated     = eat_players

        Result.new(
          changed:    dashed || moved || pellet_changes.any? || eliminated.any?,
          eliminated: eliminated,
          pellets:    pellet_changes
        )
      end

      # Survivors by size, then the eliminated with the last one eaten ranked highest.
      def standings
        survivors = alive_players.sort_by { |p| [-p["size"], p["slot"]] }
        eaten     = state["eliminations"].reverse.map { |slot| players[slot] }

        (survivors + eaten).each_with_index.map do |p, index|
          { "slot" => p["slot"], "place" => index + 1, "size" => p["size"].round(3) }
        end
      end

      def delta_frame(result)
        {
          "t"          => tick,
          "players"    => players_frame,
          "eliminated" => result.eliminated,
          "pellets"    => result.pellets
        }
      end

      # Full world state, sent periodically and on subscribe so a client that
      # missed deltas converges.
      def keyframe(eliminated: [])
        {
          "t"            => tick,
          "keyframe"     => true,
          "players"      => players_frame,
          "eliminated"   => eliminated,
          "pellets"      => [],
          "pellet_field" => state["pellets"].map { |x, y| [x.round, y.round] },
          "out"          => state["eliminations"].map { |slot| [slot, players[slot]["eaten_by"]] }
        }
      end

      private

      def players_frame
        alive_players.map do |p|
          [p["slot"], p["x"].round, p["y"].round, p["size"].round(3), dashing?(p) ? 1 : 0]
        end
      end

      def dashing?(player)
        elapsed < player["dash_until"]
      end

      def apply_dashes(dashes, now)
        dashes.count do |slot, (dx, dy)|
          player = players[slot]
          next false unless player && player["alive"]
          next false if now < player["dash_ready_at"]

          direction = unit(dx, dy) || unit(player["vx"], player["vy"])
          next false unless direction

          player["dash_dx"], player["dash_dy"] = direction
          player["dash_until"]    = now + Config::DASH_SECONDS
          player["dash_ready_at"] = now + Config::DASH_COOLDOWN_SECONDS
          true
        end.positive?
      end

      def move(player, input, dt, now)
        speed = Config.speed(player["size"])

        if now < player["dash_until"]
          player["vx"] = player["dash_dx"] * speed * Config::DASH_MULTIPLIER
          player["vy"] = player["dash_dy"] * speed * Config::DASH_MULTIPLIER
        else
          direction = input && unit(*input)
          target_x, target_y, rate =
            if direction
              [direction[0] * speed, direction[1] * speed, speed / Config::STEER_SECONDS]
            else
              [0.0, 0.0, speed / Config::GLIDE_SECONDS]
            end
          approach_velocity(player, target_x, target_y, rate * dt)
        end

        return false if player["vx"].zero? && player["vy"].zero?

        player["x"] = clamp_axis(player, "x", "vx", dt)
        player["y"] = clamp_axis(player, "y", "vy", dt)
        true
      end

      def approach_velocity(player, target_x, target_y, max_change)
        dvx = target_x - player["vx"]
        dvy = target_y - player["vy"]
        distance = Math.hypot(dvx, dvy)

        if distance <= max_change
          player["vx"] = target_x
          player["vy"] = target_y
        else
          player["vx"] += dvx / distance * max_change
          player["vy"] += dvy / distance * max_change
        end

        if Math.hypot(player["vx"], player["vy"]) < REST_SPEED && target_x.zero? && target_y.zero?
          player["vx"] = 0.0
          player["vy"] = 0.0
        end
      end

      def clamp_axis(player, axis, velocity_key, dt)
        position = player[axis] + (player[velocity_key] * dt)
        clamped  = position.clamp(0.0, Config::WORLD_SIZE)
        player[velocity_key] = 0.0 if clamped != position
        clamped
      end

      def eat_pellets
        pellets = state["pellets"]
        grid    = Hash.new { |hash, key| hash[key] = [] }
        pellets.each_with_index do |(x, y), index|
          grid[[(x / PELLET_CELL_SIZE).floor, (y / PELLET_CELL_SIZE).floor]] << index
        end

        changes = []
        eaten   = Set.new

        alive_players.each do |player|
          radius = Config.radius(player["size"])
          cells_around(player["x"], player["y"], radius).each do |cell|
            grid.fetch(cell, []).each do |index|
              next if eaten.include?(index)

              x, y = pellets[index]
              next unless Math.hypot(x - player["x"], y - player["y"]) < radius

              eaten << index
              player["size"] = [player["size"] * Config::PELLET_GROWTH, Config::MAX_SIZE].min
              radius = Config.radius(player["size"])
            end
          end
        end

        eaten.each do |index|
          pellets[index] = self.class.random_point(@rng)
          changes << [index, pellets[index][0].round, pellets[index][1].round]
        end

        changes
      end

      def cells_around(x, y, radius)
        min_x = ((x - radius) / PELLET_CELL_SIZE).floor
        max_x = ((x + radius) / PELLET_CELL_SIZE).floor
        min_y = ((y - radius) / PELLET_CELL_SIZE).floor
        max_y = ((y + radius) / PELLET_CELL_SIZE).floor

        (min_x..max_x).flat_map { |cx| (min_y..max_y).map { |cy| [cx, cy] } }
      end

      def eat_players
        eliminated = []

        alive_players.sort_by { |p| -p["size"] }.each do |eater|
          next unless eater["alive"]

          alive_players.each do |victim|
            next if victim.equal?(eater)
            next unless eater["size"] >= victim["size"] * Config::EAT_SIZE_RATIO
            next unless Math.hypot(victim["x"] - eater["x"], victim["y"] - eater["y"]) < Config.radius(eater["size"])

            grown = Math.sqrt((eater["size"]**2) + (Config::EAT_AREA_SHARE * (victim["size"]**2)))
            eater["size"] = [grown, Config::MAX_SIZE].min

            victim["alive"]    = false
            victim["eaten_by"] = eater["slot"]
            victim["vx"]       = 0.0
            victim["vy"]       = 0.0
            state["eliminations"] << victim["slot"]
            eliminated << [victim["slot"], eater["slot"]]
          end
        end

        eliminated
      end

      def unit(dx, dy)
        dx = dx.to_f
        dy = dy.to_f
        magnitude = Math.hypot(dx, dy)
        return nil if magnitude < 1e-6 || !magnitude.finite?

        [dx / magnitude, dy / magnitude]
      end
    end
  end
end
