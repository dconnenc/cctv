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
        experience_block_id: block.id, user_id: player_a.user_id, fill_amount: 30
      )

      orchestrator.start_minigame_balloon_pump!(block_id: block.id)

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

    before { orchestrator.start_minigame_balloon_pump!(block_id: block.id) }

    it "records the cumulative fill amount" do
      player_a_orchestrator.submit_balloon_pump_update!(block_id: block.id, fill_amount: 20)
      result = ExperienceMinigameBalloonResult.find_by(experience_block_id: block.id, user_id: player_a.user_id)
      expect(result.fill_amount).to eq(20)
    end

    it "is monotonic — never decreases on a stale request" do
      player_a_orchestrator.submit_balloon_pump_update!(block_id: block.id, fill_amount: 30)
      player_a_orchestrator.submit_balloon_pump_update!(block_id: block.id, fill_amount: 15)

      result = ExperienceMinigameBalloonResult.find_by(experience_block_id: block.id, user_id: player_a.user_id)
      expect(result.fill_amount).to eq(30)
    end

    it "clamps fill at target_units" do
      player_a_orchestrator.submit_balloon_pump_update!(block_id: block.id, fill_amount: 9999)
      result = ExperienceMinigameBalloonResult.find_by(experience_block_id: block.id, user_id: player_a.user_id)
      expect(result.fill_amount).to eq(50)
    end

    it "ends the block and marks the player as winner when they hit target" do
      outcome = player_a_orchestrator.submit_balloon_pump_update!(block_id: block.id, fill_amount: 50)

      block.reload
      expect(block.payload["ended_at"]).to be_present
      expect(block.status).to eq("closed")
      expect(block.payload["winner_participant_ids"]).to eq([player_a.id])
      expect(outcome[:winners].map(&:id)).to eq([player_a.id])
    end

    it "awards gold to multiple players who cross in the same close-out window" do
      player_a_orchestrator.submit_balloon_pump_update!(block_id: block.id, fill_amount: 49)
      player_b_orchestrator.submit_balloon_pump_update!(block_id: block.id, fill_amount: 49)

      ExperienceMinigameBalloonResult
        .where(experience_block_id: block.id, user_id: player_b.user_id)
        .update_all(fill_amount: 50)

      outcome = player_a_orchestrator.submit_balloon_pump_update!(block_id: block.id, fill_amount: 50)

      expect(outcome[:winners].map(&:id)).to contain_exactly(player_a.id, player_b.id)
      expect(block.reload.payload["winner_participant_ids"]).to contain_exactly(player_a.id, player_b.id)
    end

    it "ignores submissions before start" do
      block.reload
      block.update!(payload: block.payload.merge("started_at" => nil))
      outcome = player_a_orchestrator.submit_balloon_pump_update!(block_id: block.id, fill_amount: 30)
      expect(outcome[:result]).to eq(:ignored)
    end

    it "ignores submissions after end" do
      orchestrator.end_minigame_balloon_pump!(block_id: block.id)
      outcome = player_a_orchestrator.submit_balloon_pump_update!(block_id: block.id, fill_amount: 30)
      expect(outcome[:result]).to eq(:ignored)
    end

    it "tracks the leader for monitor display" do
      player_a_orchestrator.submit_balloon_pump_update!(block_id: block.id, fill_amount: 10)
      player_b_orchestrator.submit_balloon_pump_update!(block_id: block.id, fill_amount: 25)

      block.reload
      expect(block.payload["leader_fill"]).to eq(25)
      expect(block.payload["leader_participant_id"]).to eq(player_b.id)
    end
  end

  describe "#end_minigame_balloon_pump!" do
    let(:block) do
      orchestrator.add_block!(
        kind: ExperienceBlock::MINIGAME_BALLOON_PUMP,
        payload: { "target_units" => 50 }
      )
    end

    before { orchestrator.start_minigame_balloon_pump!(block_id: block.id) }

    it "stamps ended_at and closes" do
      orchestrator.end_minigame_balloon_pump!(block_id: block.id)
      block.reload
      expect(block.payload["ended_at"]).to be_present
      expect(block.status).to eq("closed")
    end

    it "is idempotent" do
      orchestrator.end_minigame_balloon_pump!(block_id: block.id)
      first = block.reload.payload["ended_at"]
      orchestrator.end_minigame_balloon_pump!(block_id: block.id)
      expect(block.reload.payload["ended_at"]).to eq(first)
    end
  end
end
