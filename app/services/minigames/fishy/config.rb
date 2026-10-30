module Minigames
  module Fishy
    # Tuning for the Fishy minigame. World units are arbitrary; clients scale the
    # world to the screen. The world is a fixed square so an avatar occupies the
    # same share of a phone screen regardless of crowd size — the starting
    # viewport is 1/32 of the world area (see fishyMath.ts).
    module Config
      TICK_HZ      = 15
      TICK_SECONDS = 1.0 / TICK_HZ
      # Clamp on the measured tick delta so a stalled loop doesn't teleport anyone.
      MAX_STEP_SECONDS = 0.2

      WORLD_SIZE   = 4000.0
      START_RADIUS = 50.0
      MAX_SIZE     = 8.0

      BASE_SPEED = 280.0
      # Each 1% of growth is 0.25% slower: 1.01 ** SPEED_EXPONENT == 0.9975.
      SPEED_EXPONENT = Math.log(0.9975) / Math.log(1.01)
      # Seconds to reach full speed while steering / to glide to a stop on release.
      STEER_SECONDS = 0.1
      GLIDE_SECONDS = 0.3

      PELLET_GROWTH      = 1.01
      PELLETS_PER_PLAYER = 15
      MIN_PELLETS        = 150
      MAX_PELLETS        = 1500
      PELLET_RADIUS      = 8.0

      EAT_SIZE_RATIO = 1.05
      EAT_AREA_SHARE = 0.5

      DASH_MULTIPLIER       = 3.0
      DASH_SECONDS          = 0.25
      DASH_COOLDOWN_SECONDS = 4.0

      COUNTDOWN_SECONDS    = 3
      KEYFRAME_SECONDS     = 5
      MAX_DURATION_SECONDS = 15 * 60
      SPAWN_MARGIN         = START_RADIUS * 2

      MIN_PLAYERS         = 2
      MAX_PLAYERS_LIMIT   = 100
      DEFAULT_MAX_PLAYERS = 50

      def self.pellet_count(player_count)
        (player_count * PELLETS_PER_PLAYER).clamp(MIN_PELLETS, MAX_PELLETS)
      end

      def self.radius(size)
        START_RADIUS * size
      end

      def self.speed(size)
        BASE_SPEED * (size**SPEED_EXPONENT)
      end
    end
  end
end
