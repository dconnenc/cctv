require "rails_helper"

RSpec.describe Experiences::Orchestrator, "the scene" do
  let(:experience) { create(:experience, status: :live) }
  let(:host_user)  { create(:user) }
  let!(:host)      { create(:experience_participant, :host, user: host_user, experience: experience) }
  let!(:player_a)  { create(:experience_participant, :audience, experience: experience) }
  let!(:player_b)  { create(:experience_participant, :audience, experience: experience) }
  let!(:player_c)  { create(:experience_participant, :audience, experience: experience) }

  subject(:orchestrator) { described_class.new(actor: host_user, experience: experience) }

  let(:block) do
    orchestrator.add_block!(
      kind: ExperienceBlock::THE_SCENE,
      payload: { "leaderboard_size" => 5 }
    )
  end

  def player_orchestrator(participant)
    described_class.new(actor: participant.user, experience: experience)
  end

  describe "#add_block!" do
    it "creates a Scene block in idle phase with the configured leaderboard size" do
      expect(block.payload["phase"]).to eq("idle")
      expect(block.payload["leaderboard_size"]).to eq(5)
      expect(block.payload["scene_started_at"]).to be_nil
    end

    it "raises when leaderboard_size is missing" do
      expect {
        orchestrator.add_block!(kind: ExperienceBlock::THE_SCENE, payload: {})
      }.to raise_error(ArgumentError)
    end
  end

  describe "#advance_the_scene_phase!" do
    it "transitions through phases and stamps scene_started_at" do
      orchestrator.advance_the_scene_phase!(block_id: block.id, phase: "collecting")
      block.reload
      expect(block.payload["phase"]).to eq("collecting")
      expect(block.payload["scene_started_at"]).to be_present
      expect(block.status).to eq("open")
    end

    it "preserves scene_started_at across collecting → voting" do
      orchestrator.advance_the_scene_phase!(block_id: block.id, phase: "collecting")
      first_stamp = block.reload.payload["scene_started_at"]

      orchestrator.advance_the_scene_phase!(block_id: block.id, phase: "voting")
      expect(block.reload.payload["scene_started_at"]).to eq(first_stamp)
    end

    it "rejects unknown phases" do
      expect {
        orchestrator.advance_the_scene_phase!(block_id: block.id, phase: "garbage")
      }.to raise_error(ArgumentError)
    end
  end

  describe "#submit_the_scene_suggestion!" do
    before { orchestrator.advance_the_scene_phase!(block_id: block.id, phase: "collecting") }

    it "creates an active suggestion for the participant" do
      suggestion = player_orchestrator(player_a).submit_the_scene_suggestion!(
        block_id: block.id, text: "  a wedding  "
      )
      expect(suggestion.text).to eq("a wedding")
      expect(suggestion.cleared_at).to be_nil
    end

    it "rejects blank suggestions" do
      expect {
        player_orchestrator(player_a).submit_the_scene_suggestion!(block_id: block.id, text: "   ")
      }.to raise_error(ArgumentError)
    end

    it "rejects a second suggestion in the same scene" do
      player_orchestrator(player_a).submit_the_scene_suggestion!(block_id: block.id, text: "first")

      expect {
        player_orchestrator(player_a).submit_the_scene_suggestion!(block_id: block.id, text: "second")
      }.to raise_error(Experiences::InvalidTransitionError)
    end

    it "allows resubmission after admin clears the prior one" do
      first = player_orchestrator(player_a).submit_the_scene_suggestion!(block_id: block.id, text: "first")
      orchestrator.clear_the_scene_suggestion!(block_id: block.id, suggestion_id: first.id)

      second = player_orchestrator(player_a).submit_the_scene_suggestion!(block_id: block.id, text: "second")
      expect(second.text).to eq("second")
      expect(second.id).not_to eq(first.id)
    end

    it "rejects when phase is idle or ended" do
      orchestrator.advance_the_scene_phase!(block_id: block.id, phase: "ended")
      expect {
        player_orchestrator(player_a).submit_the_scene_suggestion!(block_id: block.id, text: "no")
      }.to raise_error(Experiences::InvalidTransitionError)
    end
  end

  describe "#submit_the_scene_vote!" do
    let(:suggestion_a) { player_orchestrator(player_a).submit_the_scene_suggestion!(block_id: block.id, text: "a wedding") }
    let(:suggestion_b) { player_orchestrator(player_b).submit_the_scene_suggestion!(block_id: block.id, text: "a circus") }

    before do
      orchestrator.advance_the_scene_phase!(block_id: block.id, phase: "collecting")
      suggestion_a
      suggestion_b
      orchestrator.advance_the_scene_phase!(block_id: block.id, phase: "voting")
    end

    it "records a vote" do
      vote = player_orchestrator(player_c).submit_the_scene_vote!(
        block_id: block.id, suggestion_id: suggestion_a.id
      )
      expect(vote.improv_suggestion_id).to eq(suggestion_a.id)
    end

    it "allows changing a vote" do
      player_orchestrator(player_c).submit_the_scene_vote!(block_id: block.id, suggestion_id: suggestion_a.id)
      player_orchestrator(player_c).submit_the_scene_vote!(block_id: block.id, suggestion_id: suggestion_b.id)

      votes = ImprovVote.where(experience_block_id: block.id, user_id: player_c.user_id).to_a
      expect(votes.size).to eq(1)
      expect(votes.first.improv_suggestion_id).to eq(suggestion_b.id)
    end

    it "rejects voting for own suggestion" do
      expect {
        player_orchestrator(player_a).submit_the_scene_vote!(block_id: block.id, suggestion_id: suggestion_a.id)
      }.to raise_error(ArgumentError)
    end

    it "rejects voting outside the voting phase" do
      orchestrator.advance_the_scene_phase!(block_id: block.id, phase: "ended")
      expect {
        player_orchestrator(player_c).submit_the_scene_vote!(block_id: block.id, suggestion_id: suggestion_a.id)
      }.to raise_error(Experiences::InvalidTransitionError)
    end
  end

  describe "#start_next_scene!" do
    let(:suggestion_a) { player_orchestrator(player_a).submit_the_scene_suggestion!(block_id: block.id, text: "a wedding") }
    let(:suggestion_b) { player_orchestrator(player_b).submit_the_scene_suggestion!(block_id: block.id, text: "a circus") }

    before do
      orchestrator.advance_the_scene_phase!(block_id: block.id, phase: "collecting")
      suggestion_a
      suggestion_b
      orchestrator.advance_the_scene_phase!(block_id: block.id, phase: "voting")
      player_orchestrator(player_c).submit_the_scene_vote!(block_id: block.id, suggestion_id: suggestion_a.id)
    end

    it "preserves active suggestions across scenes (rolls forward)" do
      orchestrator.start_next_scene!(block_id: block.id)
      active_ids = block.improv_suggestions.active.pluck(:id)
      expect(active_ids).to contain_exactly(suggestion_a.id, suggestion_b.id)
    end

    it "scopes votes to the new scene_started_at, leaving prior votes inert" do
      first_stamp = block.reload.payload["scene_started_at"]

      orchestrator.start_next_scene!(block_id: block.id)
      second_stamp = block.reload.payload["scene_started_at"]
      expect(second_stamp).not_to eq(first_stamp)

      tally = TheScene::Tally.full(block: block.reload, scene_started_at: second_stamp)
      expect(tally.map(&:vote_count).sum).to eq(0)
    end

    it "lets a participant submit a fresh suggestion in the next scene" do
      orchestrator.start_next_scene!(block_id: block.id)

      expect {
        player_orchestrator(player_a).submit_the_scene_suggestion!(block_id: block.id, text: "another")
      }.to raise_error(Experiences::InvalidTransitionError),
        "active suggestion from prior scene should still block resubmission"

      orchestrator.clear_the_scene_suggestion!(block_id: block.id, suggestion_id: suggestion_a.id)
      fresh = player_orchestrator(player_a).submit_the_scene_suggestion!(block_id: block.id, text: "another")
      expect(fresh).to be_persisted
    end
  end

  describe "clear actions" do
    let(:suggestion_a) { player_orchestrator(player_a).submit_the_scene_suggestion!(block_id: block.id, text: "a wedding") }
    let(:suggestion_b) { player_orchestrator(player_b).submit_the_scene_suggestion!(block_id: block.id, text: "a circus") }

    before do
      orchestrator.advance_the_scene_phase!(block_id: block.id, phase: "collecting")
      suggestion_a
      suggestion_b
      orchestrator.advance_the_scene_phase!(block_id: block.id, phase: "voting")
      player_orchestrator(player_c).submit_the_scene_vote!(block_id: block.id, suggestion_id: suggestion_a.id)
    end

    it "clear_top removes the highest-voted suggestion" do
      orchestrator.clear_the_scene_top!(block_id: block.id)
      expect(suggestion_a.reload.cleared_at).to be_present
      expect(suggestion_b.reload.cleared_at).to be_nil
    end

    it "clear_specific removes the named suggestion" do
      orchestrator.clear_the_scene_suggestion!(block_id: block.id, suggestion_id: suggestion_b.id)
      expect(suggestion_b.reload.cleared_at).to be_present
      expect(suggestion_a.reload.cleared_at).to be_nil
    end

    it "clear_all removes every active suggestion" do
      orchestrator.clear_the_scene_all!(block_id: block.id)
      expect(suggestion_a.reload.cleared_at).to be_present
      expect(suggestion_b.reload.cleared_at).to be_present
    end
  end
end
