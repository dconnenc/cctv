require "rails_helper"

RSpec.describe Experiences::Orchestrator, "minigame fishy" do
  let(:experience) { create(:experience, status: :live) }
  let(:host_user)  { create(:user) }
  let!(:host)      { create(:experience_participant, :host, user: host_user, experience: experience) }
  let!(:player_a)  { create(:experience_participant, :audience, experience: experience, joined_at: 3.minutes.ago) }
  let!(:player_b)  { create(:experience_participant, :player, experience: experience, joined_at: 2.minutes.ago) }

  subject(:orchestrator) { described_class.new(actor: host_user, experience: experience) }

  let(:block) do
    orchestrator.add_block!(kind: ExperienceBlock::MINIGAME_FISHY, payload: { "title" => "Fish!", "max_players" => 10 })
  end

  after do
    Minigames::Fishy::Store.for(block.reload).clear! if block.payload["started_at"]
  end

  describe "#add_block!" do
    it "stores config and queued state" do
      expect(block.payload).to include(
        "title" => "Fish!", "max_players" => 10, "started_at" => nil, "ended_at" => nil, "roster" => [],
        "world_size" => Minigames::Fishy::Config::WORLD_SIZE
      )
    end

    it "defaults max_players" do
      default_block = orchestrator.add_block!(kind: ExperienceBlock::MINIGAME_FISHY, payload: {})

      expect(default_block.payload["max_players"]).to eq(Minigames::Fishy::Config::DEFAULT_MAX_PLAYERS)
      expect(default_block.payload["title"]).to eq("Fishy")
    end

    it "rejects a cap outside 2..100" do
      [1, 101].each do |cap|
        expect {
          orchestrator.add_block!(kind: ExperienceBlock::MINIGAME_FISHY, payload: { "max_players" => cap })
        }.to raise_error(ArgumentError, /max_players/)
      end
    end
  end

  describe "#update_block!" do
    it "updates config without dropping game state" do
      orchestrator.start_minigame_fishy!(block: block)
      roster = block.reload.payload["roster"]

      orchestrator.update_block!(block: block, payload: { "title" => "Big Fish", "max_players" => 20 }, visible_to_segment_ids: [])

      expect(block.reload.payload).to include("title" => "Big Fish", "max_players" => 20, "roster" => roster)
    end

    it "re-validates the player cap" do
      expect {
        orchestrator.update_block!(block: block, payload: block.payload.merge("max_players" => 0), visible_to_segment_ids: [])
      }.to raise_error(ArgumentError)
    end
  end

  describe "#start_minigame_fishy!" do
    it "builds the roster from non-staff participants, opens the block, seeds Redis, and enqueues the loop" do
      expect {
        orchestrator.start_minigame_fishy!(block: block)
      }.to have_enqueued_job(Minigames::FishyTickJob)

      block.reload
      expect(block.status).to eq("open")
      expect(block.payload["roster"]).to eq([player_a.id, player_b.id])
      expect(Time.zone.parse(block.payload["started_at"])).to be > Time.current

      state = Minigames::Fishy::Store.for(block).read_state
      expect(state["players"].size).to eq(2)
      expect(state["started_at"]).to eq(block.payload["started_at"])
    end

    it "caps the roster at max_players in join order" do
      late = create(:experience_participant, :audience, experience: experience, joined_at: 1.minute.ago)
      block.update!(payload: block.payload.merge("max_players" => 2))

      orchestrator.start_minigame_fishy!(block: block)

      expect(block.reload.payload["roster"]).to eq([player_a.id, player_b.id])
      expect(block.payload["roster"]).not_to include(late.id)
    end

    it "excludes participants the block is not visible to" do
      block.update!(visible_to_roles: ["audience"])
      create(:experience_participant, :audience, experience: experience, joined_at: 1.minute.ago)

      orchestrator.start_minigame_fishy!(block: block)

      expect(block.reload.payload["roster"]).not_to include(player_b.id)
    end

    it "requires at least two players" do
      player_b.destroy!

      expect {
        orchestrator.start_minigame_fishy!(block: block)
      }.to raise_error(Experiences::InvalidTransitionError, /at least 2/)
    end
  end

  describe "#end_minigame_fishy!" do
    it "records standings from live state and a winner" do
      orchestrator.start_minigame_fishy!(block: block)
      store = Minigames::Fishy::Store.for(block.reload)
      state = store.read_state
      state["players"][1]["size"] = 1.4
      store.write_state(state)

      orchestrator.end_minigame_fishy!(block: block)

      block.reload
      expect(block.payload["ended_at"]).to be_present
      expect(block.payload["winner_participant_id"]).to eq(player_b.id)
      expect(block.payload["standings"].map { |s| s["participant_id"] }).to eq([player_b.id, player_a.id])
      expect(store).to be_stopped
    end

    it "is a no-op when already ended" do
      orchestrator.start_minigame_fishy!(block: block)
      orchestrator.end_minigame_fishy!(block: block)
      ended_at = block.reload.payload["ended_at"]

      orchestrator.end_minigame_fishy!(block: block)

      expect(block.reload.payload["ended_at"]).to eq(ended_at)
    end
  end

  describe "#restart_minigame_fishy!" do
    it "returns to queued and clears the live state" do
      orchestrator.start_minigame_fishy!(block: block)
      store = Minigames::Fishy::Store.for(block.reload)

      orchestrator.restart_minigame_fishy!(block: block)

      block.reload
      expect(block.payload).to include("started_at" => nil, "ended_at" => nil, "roster" => [], "standings" => [])
      expect(store.read_state).to be_nil
    end
  end
end
