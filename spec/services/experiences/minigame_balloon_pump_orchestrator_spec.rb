require "rails_helper"

RSpec.describe Experiences::Orchestrator, "minigame balloon pump" do
  let(:experience) { create(:experience, status: :live) }
  let(:host_user)  { create(:user) }
  let!(:host)      { create(:experience_participant, :host, user: host_user, experience: experience) }
  let!(:player_a)  { create(:experience_participant, :audience, experience: experience) }
  let!(:player_b)  { create(:experience_participant, :audience, experience: experience) }

  subject(:orchestrator) { described_class.new(actor: host_user, experience: experience) }

  describe "#add_block!" do
    it "creates a balloon pump block with target_units and zeroed state" do
      block = orchestrator.add_block!(
        kind: ExperienceBlock::MINIGAME_BALLOON_PUMP,
        payload: { "target_units" => 100 }
      )

      expect(block.payload["variant"]).to eq("balloon_pump")
      expect(block.payload["target_units"]).to eq(100)
      expect(block.payload["started_at"]).to be_nil
      expect(block.payload["leader_fill"]).to eq(0)
    end

    it "raises when target_units is zero or negative" do
      expect {
        orchestrator.add_block!(kind: ExperienceBlock::MINIGAME_BALLOON_PUMP, payload: { "target_units" => 0 })
      }.to raise_error(ArgumentError)
    end
  end

  describe "#start_minigame_balloon_pump!" do
    let(:block) do
      orchestrator.add_block!(
        kind: ExperienceBlock::MINIGAME_BALLOON_PUMP,
        payload: { "target_units" => 50 }
      )
    end

    it "stamps started_at, opens block, and clears any prior results" do
      ExperienceMinigameBalloonResult.create!(
        experience_block_id: block.id, experience_participant: player_a, fill_amount: 30
      )

      orchestrator.start_minigame_balloon_pump!(block: block)

      block.reload
      expect(block.payload["started_at"]).to be_present
      expect(block.status).to eq("open")
      expect(ExperienceMinigameBalloonResult.where(experience_block_id: block.id).count).to eq(0)
    end
  end

  describe "#submit_balloon_pump_update!" do
    let(:block) do
      orchestrator.add_block!(
        kind: ExperienceBlock::MINIGAME_BALLOON_PUMP,
        payload: { "target_units" => 50 }
      )
    end

    let(:player_a_orchestrator) { described_class.new(actor: player_a.user, experience: experience) }
    let(:player_b_orchestrator) { described_class.new(actor: player_b.user, experience: experience) }

    before { orchestrator.start_minigame_balloon_pump!(block: block) }

    it "records the cumulative fill amount" do
      player_a_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 20)
      result = ExperienceMinigameBalloonResult.find_by(experience_block_id: block.id, experience_participant: player_a)
      expect(result.fill_amount).to eq(20)
    end

    it "is monotonic — never decreases on a stale request" do
      player_a_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 30)
      player_a_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 15)

      result = ExperienceMinigameBalloonResult.find_by(experience_block_id: block.id, experience_participant: player_a)
      expect(result.fill_amount).to eq(30)
    end

    it "clamps fill at target_units" do
      player_a_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 9999)
      result = ExperienceMinigameBalloonResult.find_by(experience_block_id: block.id, experience_participant: player_a)
      expect(result.fill_amount).to eq(50)
    end

    it "ends the block and marks the player as winner when they hit target" do
      outcome = player_a_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 50)

      block.reload
      expect(block.payload["ended_at"]).to be_present
      expect(block.status).to eq("open")
      expect(block.payload["winner_participant_ids"]).to eq([player_a.id])
      expect(outcome[:winners].map(&:id)).to eq([player_a.id])
    end

    it "declares only the triggering participant the winner even when another participant already has fill_amount >= target in the DB" do
      ExperienceMinigameBalloonResult.create!(
        experience_block_id: block.id,
        experience_participant: player_b,
        fill_amount: 50
      )

      outcome = player_a_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 50)

      expect(outcome[:winners].map(&:id)).to eq([player_a.id])
      expect(block.reload.payload["winner_participant_ids"]).to eq([player_a.id])
    end

    it "ignores a second participant who reaches target after the game has already ended" do
      player_a_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 50)
      outcome = player_b_orchestrator.submit_balloon_pump_update!(block: block.reload, fill_amount: 50)

      expect(outcome[:result]).to eq(:ignored)
    end

    it "ignores submissions before start" do
      block.reload
      block.update!(payload: block.payload.merge("started_at" => nil))
      outcome = player_a_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 30)
      expect(outcome[:result]).to eq(:ignored)
    end

    it "ignores submissions after end" do
      orchestrator.end_minigame_balloon_pump!(block: block)
      outcome = player_a_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 30)
      expect(outcome[:result]).to eq(:ignored)
    end

    it "tracks the leader for monitor display" do
      player_a_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 10)
      player_b_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 25)

      block.reload
      expect(block.payload["leader_fill"]).to eq(25)
      expect(block.payload["leader_participant_id"]).to eq(player_b.id)
    end

    context "when the game ends in the DB while a non-winning leader update is in flight" do
      it "does not wipe ended_at" do
        stale_block = block
        ExperienceBlock.where(id: block.id).update_all(
          "payload = payload || '{\"ended_at\": \"2099-01-01T00:00:00Z\"}'::jsonb"
        )

        player_a_orchestrator.submit_balloon_pump_update!(block: stale_block, fill_amount: 20)

        expect(block.reload.payload["ended_at"]).to be_present
      end
    end

    it "returns leader_updated: true when the fill sets a new high" do
      outcome = player_a_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 20)

      expect(outcome[:leader_updated]).to be true
    end

    it "returns leader_updated: false when the fill does not beat the current leader" do
      player_a_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 30)
      outcome = player_b_orchestrator.submit_balloon_pump_update!(block: block.reload, fill_amount: 15)

      expect(outcome[:leader_updated]).to be false
    end

    it "returns leader_updated: false in the winners path" do
      outcome = player_a_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 50)

      expect(outcome[:winners]).not_to be_empty
      expect(outcome[:leader_updated]).to be false
    end
  end

  describe "#end_minigame_balloon_pump!" do
    let(:block) do
      orchestrator.add_block!(
        kind: ExperienceBlock::MINIGAME_BALLOON_PUMP,
        payload: { "target_units" => 50 }
      )
    end

    before { orchestrator.start_minigame_balloon_pump!(block: block) }

    it "stamps ended_at and keeps the block open so the monitor can show the podium" do
      orchestrator.end_minigame_balloon_pump!(block: block)
      block.reload
      expect(block.payload["ended_at"]).to be_present
      expect(block.status).to eq("open")
    end

    it "is idempotent" do
      orchestrator.end_minigame_balloon_pump!(block: block)
      first = block.reload.payload["ended_at"]
      orchestrator.end_minigame_balloon_pump!(block: block)
      expect(block.reload.payload["ended_at"]).to eq(first)
    end
  end

  describe "#restart_minigame_balloon_pump!" do
    let(:block) do
      orchestrator.add_block!(
        kind: ExperienceBlock::MINIGAME_BALLOON_PUMP,
        payload: { "target_units" => 50 }
      )
    end

    let(:player_a_orchestrator) { described_class.new(actor: player_a.user, experience: experience) }

    before do
      orchestrator.start_minigame_balloon_pump!(block: block)
      player_a_orchestrator.submit_balloon_pump_update!(block: block, fill_amount: 50)
    end

    it "clears game state and results so it can be started again" do
      orchestrator.restart_minigame_balloon_pump!(block: block)
      block.reload

      expect(block.payload["started_at"]).to be_nil
      expect(block.payload["ended_at"]).to be_nil
      expect(block.payload["winner_participant_ids"]).to eq([])
      expect(block.payload["leader_fill"]).to eq(0)
      expect(block.payload["leader_participant_id"]).to be_nil
      expect(block.experience_minigame_balloon_results.count).to eq(0)
    end

    it "leaves the block in a startable state" do
      orchestrator.restart_minigame_balloon_pump!(block: block)
      orchestrator.start_minigame_balloon_pump!(block: block.reload)

      expect(block.reload.payload["started_at"]).to be_present
      expect(block.payload["ended_at"]).to be_nil
    end
  end
end
