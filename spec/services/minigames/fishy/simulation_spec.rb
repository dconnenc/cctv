require "rails_helper"

RSpec.describe Minigames::Fishy::Simulation do
  let(:config) { Minigames::Fishy::Config }

  def player(slot, x:, y:, size: 1.0, **attrs)
    {
      "slot" => slot, "x" => x, "y" => y, "vx" => 0.0, "vy" => 0.0, "size" => size,
      "alive" => true, "eaten_by" => nil,
      "dash_dx" => 0.0, "dash_dy" => 0.0, "dash_until" => 0.0, "dash_ready_at" => 0.0
    }.merge(attrs.transform_keys(&:to_s))
  end

  def build(players:, pellets: [])
    described_class.new(
      {
        "started_at" => "2026-01-01T00:00:00.000Z", "tick" => 0, "elapsed" => 0.0,
        "players" => players, "pellets" => pellets, "eliminations" => []
      },
      rng: Random.new(1)
    )
  end

  describe ".seed" do
    it "spawns every slot alive at size 1 inside the world with pellets scaled to the roster" do
      state = described_class.seed(slot_count: 20, started_at: "t", rng: Random.new(3))

      expect(state["players"].size).to eq(20)
      expect(state["players"]).to all(include("alive" => true, "size" => 1.0))
      expect(state["players"].map { |p| [p["x"], p["y"]] }.flatten).to all(be_between(0, config::WORLD_SIZE))
      expect(state["pellets"].size).to eq(config.pellet_count(20))
    end

    it "keeps spawns apart" do
      state  = described_class.seed(slot_count: 10, started_at: "t", rng: Random.new(5))
      points = state["players"].map { |p| [p["x"], p["y"]] }

      points.combination(2).each do |(ax, ay), (bx, by)|
        expect(Math.hypot(ax - bx, ay - by)).to be >= described_class::SPAWN_MIN_DISTANCE
      end
    end
  end

  describe "speed" do
    it "slows 0.25% for each 1% of growth" do
      expect(config.speed(1.01) / config.speed(1.0)).to be_within(1e-9).of(0.9975)
      expect(config.speed(2.0 * 1.01) / config.speed(2.0)).to be_within(1e-9).of(0.9975)
    end
  end

  describe "#step movement" do
    it "moves toward the input direction" do
      sim = build(players: [player(0, x: 1000.0, y: 1000.0), player(1, x: 3000.0, y: 3000.0)])

      result = sim.step(0.1, inputs: { 0 => [1.0, 0.0] })

      expect(result.changed).to be(true)
      expect(sim.players[0]["x"]).to be > 1000.0
      expect(sim.players[0]["y"]).to eq(1000.0)
    end

    it "glides to a stop after the finger lifts and then reports no change" do
      sim = build(players: [player(0, x: 1000.0, y: 1000.0), player(1, x: 3000.0, y: 3000.0)])
      5.times { sim.step(0.1, inputs: { 0 => [1.0, 0.0] }) }

      sim.step(0.1)
      expect(sim.players[0]["vx"]).to be > 0

      5.times { sim.step(0.1) }
      expect(sim.players[0]["vx"]).to eq(0.0)
      expect(sim.step(0.1).changed).to be(false)
    end

    it "keeps players inside the world" do
      sim = build(players: [player(0, x: 5.0, y: 1000.0), player(1, x: 3000.0, y: 3000.0)])

      10.times { sim.step(0.1, inputs: { 0 => [-1.0, 0.0] }) }

      expect(sim.players[0]["x"]).to eq(0.0)
    end
  end

  describe "#step pellets" do
    it "grows the eater 1% per pellet and respawns it" do
      sim = build(
        players: [player(0, x: 1000.0, y: 1000.0), player(1, x: 3000.0, y: 3000.0)],
        pellets: [[1010.0, 1000.0], [2000.0, 2000.0]]
      )

      result = sim.step(0.0)

      expect(sim.players[0]["size"]).to be_within(1e-9).of(1.01)
      expect(result.pellets.map(&:first)).to eq([0])
      expect(result.changed).to be(true)
    end
  end

  describe "#step eating players" do
    it "requires the eater to be at least 1.05x the victim" do
      sim = build(players: [player(0, x: 1000.0, y: 1000.0, size: 1.04), player(1, x: 1010.0, y: 1000.0)])

      expect(sim.step(0.0).eliminated).to be_empty
    end

    it "eliminates the victim and grows the eater by half the victim's area" do
      sim = build(players: [player(0, x: 1000.0, y: 1000.0, size: 1.05), player(1, x: 1010.0, y: 1000.0)])

      result = sim.step(0.0)

      expect(result.eliminated).to eq([[1, 0]])
      expect(sim.players[1]).to include("alive" => false, "eaten_by" => 0)
      expect(sim.players[0]["size"]).to be_within(1e-9).of(Math.sqrt((1.05**2) + 0.5))
    end

    it "requires the victim's center inside the eater" do
      far = config.radius(1.5) + 1
      sim = build(players: [player(0, x: 1000.0, y: 1000.0, size: 1.5), player(1, x: 1000.0 + far, y: 1000.0)])

      expect(sim.step(0.0).eliminated).to be_empty
    end

    it "is finished when one player remains" do
      sim = build(players: [player(0, x: 1000.0, y: 1000.0, size: 2.0), player(1, x: 1010.0, y: 1000.0)])

      sim.step(0.0)

      expect(sim).to be_finished
    end
  end

  describe "#step dash" do
    it "bursts in the dash direction and enforces the cooldown" do
      sim = build(players: [player(0, x: 1000.0, y: 1000.0), player(1, x: 3000.0, y: 3000.0)])

      sim.step(0.05, dashes: { 0 => [0.0, 1.0] })
      dash_speed = sim.players[0]["vy"]
      expect(dash_speed).to be_within(1e-6).of(config.speed(1.0) * config::DASH_MULTIPLIER)

      ready_at = sim.players[0]["dash_ready_at"]
      expect(ready_at).to be_within(1e-9).of(0.05 + config::DASH_COOLDOWN_SECONDS)

      sim.step(0.05, dashes: { 0 => [1.0, 0.0] })
      expect(sim.players[0]["dash_ready_at"]).to eq(ready_at)
      expect(sim.players[0]["dash_dx"]).to eq(0.0)
    end

    it "allows another dash once the cooldown elapses" do
      sim = build(players: [player(0, x: 1000.0, y: 1000.0, dash_ready_at: 4.0), player(1, x: 3000.0, y: 3000.0)])
      sim.state["elapsed"] = 4.0

      sim.step(0.05, dashes: { 0 => [1.0, 0.0] })

      expect(sim.players[0]["dash_dx"]).to eq(1.0)
    end
  end

  describe "#standings" do
    it "ranks survivors by size, then the eliminated with the last eaten highest" do
      sim = build(players: [
        player(0, x: 0.0, y: 0.0, size: 1.2),
        player(1, x: 0.0, y: 0.0, alive: false, eaten_by: 0),
        player(2, x: 0.0, y: 0.0, size: 1.5),
        player(3, x: 0.0, y: 0.0, alive: false, eaten_by: 2)
      ])
      sim.state["eliminations"] = [1, 3]

      expect(sim.standings.map { |s| [s["slot"], s["place"]] }).to eq([[2, 1], [0, 2], [3, 3], [1, 4]])
    end
  end

  describe "frames" do
    it "builds a keyframe with every pellet and who ate whom" do
      sim = build(
        players: [player(0, x: 10.4, y: 20.6, size: 1.5), player(1, x: 0.0, y: 0.0, alive: false, eaten_by: 0)],
        pellets: [[1.2, 3.7]]
      )
      sim.state["eliminations"] = [1]

      frame = sim.keyframe

      expect(frame).to include(
        "keyframe" => true,
        "players" => [[0, 10, 21, 1.5, 0]],
        "pellet_field" => [[1, 4]],
        "out" => [[1, 0]]
      )
    end
  end
end
