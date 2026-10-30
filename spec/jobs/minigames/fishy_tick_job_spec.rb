require "rails_helper"

RSpec.describe Minigames::FishyTickJob do
  let(:experience) { create(:experience, status: :live) }
  let(:host_user)  { create(:user) }
  let!(:host)      { create(:experience_participant, :host, user: host_user, experience: experience) }
  let!(:player_a)  { create(:experience_participant, :audience, experience: experience) }
  let!(:player_b)  { create(:experience_participant, :audience, experience: experience) }
  let(:orchestrator) { Experiences::Orchestrator.new(actor: host_user, experience: experience) }

  let(:started_at) { 1.second.ago.iso8601(3) }
  let(:block) do
    orchestrator.add_block!(kind: ExperienceBlock::MINIGAME_FISHY, payload: {}).tap do |b|
      b.update!(status: :open, payload: b.payload.merge("started_at" => started_at, "roster" => [player_a.id, player_b.id]))
    end
  end
  let(:store) { Minigames::Fishy::Store.for(block) }
  let(:live_stream_key) { Experiences::Broadcaster.live_stream_key(experience) }
  let(:frames) { [] }

  def seed(players)
    state = Minigames::Fishy::Simulation.seed(slot_count: 2, started_at: started_at, rng: Random.new(1))
    players.each_with_index { |attrs, slot| state["players"][slot].merge!(attrs) }
    state["pellets"] = [[3900.0, 3900.0]]
    store.write_state(state)
  end

  before do
    allow(ActionCable.server).to receive(:broadcast) do |stream_key, message|
      frames << message if stream_key == live_stream_key
    end
  end

  after { store.clear! }

  describe Minigames::Fishy::Runner do
    subject(:runner) { described_class.new(block: block, store: store) }

    before do
      seed([{ "x" => 500.0, "y" => 500.0 }, { "x" => 2500.0, "y" => 2500.0 }])
      runner.load
      runner.broadcast_keyframe
      frames.clear
    end

    it "broadcasts a delta when a player moves" do
      store.set_input(0, 1.0, 0.0)

      expect(runner.tick!(0.1)).to eq(:continue)

      expect(frames.size).to eq(1)
      expect(frames.first).to include(type: "minigame_fishy_frame", block_id: block.id, started_at: started_at)
      expect(frames.first[:players].first.first(2)).to eq([0, (500 + (Minigames::Fishy::Config::BASE_SPEED * 0.1)).round])
      expect(store.read_state["tick"]).to eq(1)
    end

    it "skips the broadcast when nothing changed" do
      runner.tick!(0.1)

      expect(frames).to be_empty
    end

    it "sends a keyframe when one is due even if idle" do
      runner.simulation.state["elapsed"] = Minigames::Fishy::Config::KEYFRAME_SECONDS

      runner.tick!(0.1)

      expect(frames.size).to eq(1)
      expect(frames.first[:keyframe]).to be(true)
    end

    it "does not advance during the countdown" do
      block.update!(payload: block.payload.merge("started_at" => 5.seconds.from_now.iso8601(3)))
      countdown_store  = Minigames::Fishy::Store.for(block)
      countdown_runner = described_class.new(block: block, store: countdown_store)
      countdown_store.write_state(store.read_state.merge("started_at" => countdown_store.generation))
      countdown_runner.load

      expect(countdown_runner.tick!(0.1)).to eq(:continue)
      expect(countdown_store.read_state["tick"]).to eq(0)
      countdown_store.clear!
    end

    it "finalizes when one player remains" do
      seed([{ "x" => 500.0, "y" => 500.0, "size" => 2.0 }, { "x" => 510.0, "y" => 500.0 }])
      runner.load

      expect(runner.tick!(0.05)).to eq(:finished)

      payload = block.reload.payload
      expect(payload["winner_participant_id"]).to eq(player_a.id)
      expect(payload["standings"].map { |s| s["participant_id"] }).to eq([player_a.id, player_b.id])
      expect(frames.last[:eliminated]).to eq([[1, 0]])
    end

    it "stops when the game was stopped" do
      store.stop!

      expect(runner.tick!(0.1)).to eq(:stopped)
    end

    it "is no longer current after a restart" do
      orchestrator.restart_minigame_fishy!(block: block)

      expect(runner.game_current?).to be(false)
    end
  end

  describe "#perform" do
    it "exits without looping when the game generation is stale" do
      seed([{}, {}])

      described_class.perform_now(block.id, "2020-01-01T00:00:00.000Z")

      expect(frames).to be_empty
    end

    it "exits when another loop holds the lease" do
      seed([{}, {}])
      store.acquire_lease("other")
      stub_const("#{described_class}::LEASE_WAIT_SECONDS", 0)

      described_class.perform_now(block.id, started_at)

      expect(frames).to be_empty
    end

    it "runs until the game is stopped and releases its lease" do
      seed([{}, {}])
      allow_any_instance_of(Minigames::Fishy::Runner).to receive(:tick!).and_return(:continue, :continue, :stopped)

      described_class.perform_now(block.id, started_at)

      expect(frames.first[:keyframe]).to be(true)
      expect(store).not_to be_running
    end
  end
end
