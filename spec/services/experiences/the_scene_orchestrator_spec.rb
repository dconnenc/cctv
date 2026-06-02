require "rails_helper"

RSpec.describe Experiences::Orchestrator, "the scene" do
  let(:experience) { create(:experience, status: :live) }
  let(:host_user)  { create(:user) }
  let!(:host)      { create(:experience_participant, :host, user: host_user, experience: experience) }
  let!(:player_a)  { create(:experience_participant, :audience, experience: experience) }
  let!(:player_b)  { create(:experience_participant, :audience, experience: experience) }
  let!(:player_c)  { create(:experience_participant, :audience, experience: experience) }
  let!(:player_d)  { create(:experience_participant, :audience, experience: experience) }
  let!(:player_e)  { create(:experience_participant, :audience, experience: experience) }

  subject(:orchestrator) { described_class.new(actor: host_user, experience: experience) }

  let(:block) do
    orchestrator.add_block!(
      kind: ExperienceBlock::THE_SCENE,
      payload: {
        "leaderboard_size"          => 5,
        "prompt_input_count"        => 3,
        "performer_participant_ids" => []
      }
    )
  end

  def player_orchestrator(participant)
    described_class.new(actor: participant.user, experience: experience)
  end

  def prompt_holders(blk)
    blk.reload.payload["prompt_participant_ids"].map(&:to_s)
  end

  def buzzer_holder(blk)
    blk.reload.payload["buzzer_participant_id"]
  end

  describe "#add_block!" do
    it "creates a Scene block in idle phase with configured fields" do
      expect(block.payload["phase"]).to eq("idle")
      expect(block.payload["leaderboard_size"]).to eq(5)
      expect(block.payload["prompt_input_count"]).to eq(3)
      expect(block.payload["performer_participant_ids"]).to eq([])
      expect(block.payload["prompt_participant_ids"]).to eq([])
      expect(block.payload["buzzer_participant_id"]).to be_nil
      expect(block.payload["scene_started_at"]).to be_nil
    end

    it "defaults prompt_input_count to 3 when omitted" do
      blk = orchestrator.add_block!(
        kind: ExperienceBlock::THE_SCENE,
        payload: { "leaderboard_size" => 5 }
      )
      expect(blk.payload["prompt_input_count"]).to eq(3)
    end

    it "stores performer_participant_ids when provided" do
      blk = orchestrator.add_block!(
        kind: ExperienceBlock::THE_SCENE,
        payload: {
          "leaderboard_size" => 5,
          "performer_participant_ids" => [player_a.id, player_b.id]
        }
      )
      expect(blk.payload["performer_participant_ids"]).to contain_exactly(player_a.id, player_b.id)
    end

    it "raises when leaderboard_size is missing" do
      expect {
        orchestrator.add_block!(kind: ExperienceBlock::THE_SCENE, payload: {})
      }.to raise_error(ArgumentError)
    end
  end

  describe "#start_the_scene!" do
    it "transitions to collecting and stamps scene_started_at" do
      orchestrator.start_the_scene!(block: block)
      payload = block.reload.payload
      expect(payload["phase"]).to eq("collecting")
      expect(payload["scene_started_at"]).to be_present
      expect(block.status).to eq("open")
    end

    it "randomly assigns prompt holders and a buzzer holder from non-performer audience" do
      orchestrator.start_the_scene!(block: block)

      prompts = prompt_holders(block)
      buzzer  = buzzer_holder(block)
      eligible = [player_a, player_b, player_c, player_d, player_e].map(&:id)

      expect(prompts.size).to eq(3)
      expect(prompts).to all(be_in(eligible))
      expect(buzzer).to be_in(eligible)
      expect(prompts).not_to include(buzzer)
      expect(prompts).not_to include(host.id)
    end

    it "excludes performers from prompt and buzzer assignment" do
      orchestrator.update_the_scene_performers!(
        block: block,
        performer_participant_ids: [player_a.id, player_b.id]
      )
      orchestrator.start_the_scene!(block: block)

      excluded = [player_a.id, player_b.id, host.id]
      expect(prompt_holders(block)).not_to include(*excluded)
      expect(buzzer_holder(block)).not_to be_in(excluded)
    end

    it "picks what's available when prompt_input_count exceeds eligible pool" do
      orchestrator.update_the_scene_performers!(
        block: block,
        performer_participant_ids: [player_a.id, player_b.id, player_c.id]
      )
      orchestrator.start_the_scene!(block: block)

      prompts = prompt_holders(block)
      buzzer  = buzzer_holder(block)

      # 2 eligible, prompt_input_count=3: 1 buzzer reserved, 1 prompt.
      expect(prompts.size).to eq(1)
      expect(buzzer).not_to be_nil
      expect(prompts).not_to include(buzzer)
    end
  end

  describe "#submit_the_scene_suggestion!" do
    before do
      orchestrator.start_the_scene!(block: block)
    end

    it "accepts a suggestion from a prompt recipient" do
      recipient = experience.experience_participants.find(prompt_holders(block).first)
      suggestion = player_orchestrator(recipient).submit_the_scene_suggestion!(
        block: block, text: "  a wedding  "
      )
      expect(suggestion.text).to eq("a wedding")
      expect(suggestion.cleared_at).to be_nil
    end

    it "rejects suggestions from non-recipients" do
      non_recipient_id = experience.experience_participants.where.not(role: "host").pluck(:id).map(&:to_s) - prompt_holders(block) - [buzzer_holder(block)]
      skip "no non-recipient available" if non_recipient_id.empty?
      non_recipient = experience.experience_participants.find(non_recipient_id.first)

      expect {
        player_orchestrator(non_recipient).submit_the_scene_suggestion!(block: block, text: "no")
      }.to raise_error(Experiences::ForbiddenError)
    end

    it "rejects suggestions from the buzzer holder" do
      buzzer = experience.experience_participants.find(buzzer_holder(block))
      expect {
        player_orchestrator(buzzer).submit_the_scene_suggestion!(block: block, text: "nope")
      }.to raise_error(Experiences::ForbiddenError)
    end

    it "edits the existing suggestion in place, preserving id and votes" do
      recipient_id = prompt_holders(block).first
      recipient = experience.experience_participants.find(recipient_id)
      first = player_orchestrator(recipient).submit_the_scene_suggestion!(block: block, text: "first")
      second = player_orchestrator(recipient).submit_the_scene_suggestion!(block: block, text: "second")

      expect(second.id).to eq(first.id)
      expect(second.text).to eq("second")
    end

    it "rejects blank suggestions" do
      recipient = experience.experience_participants.find(prompt_holders(block).first)
      expect {
        player_orchestrator(recipient).submit_the_scene_suggestion!(block: block, text: "   ")
      }.to raise_error(ArgumentError)
    end

    it "rejects suggestions in non-collecting phases" do
      orchestrator.end_the_scene!(block: block)
      recipient = experience.experience_participants.find_by(role: "audience")
      expect {
        player_orchestrator(recipient).submit_the_scene_suggestion!(block: block, text: "x")
      }.to raise_error(Experiences::InvalidTransitionError)
    end
  end

  describe "#submit_the_scene_vote!" do
    before do
      orchestrator.start_the_scene!(block: block)
      prompts = prompt_holders(block)
      @recipient_a = experience.experience_participants.find(prompts[0])
      @recipient_b = experience.experience_participants.find(prompts[1])
      @suggestion_a = player_orchestrator(@recipient_a).submit_the_scene_suggestion!(block: block, text: "a wedding")
      @suggestion_b = player_orchestrator(@recipient_b).submit_the_scene_suggestion!(block: block, text: "a circus")
    end

    it "records a vote from any audience participant once 2+ suggestions exist" do
      voter = audience_voter
      vote = player_orchestrator(voter).submit_the_scene_vote!(block: block, suggestion_id: @suggestion_a.id)
      expect(vote.improv_suggestion_id).to eq(@suggestion_a.id)
    end

    it "allows changing a vote until the buzzer is pressed" do
      voter = audience_voter
      player_orchestrator(voter).submit_the_scene_vote!(block: block, suggestion_id: @suggestion_a.id)
      player_orchestrator(voter).submit_the_scene_vote!(block: block, suggestion_id: @suggestion_b.id)

      votes = ImprovVote.where(experience_block_id: block.id, experience_participant: voter).to_a
      expect(votes.size).to eq(1)
      expect(votes.first.improv_suggestion_id).to eq(@suggestion_b.id)
    end

    it "rejects votes from the buzzer holder" do
      buzzer = experience.experience_participants.find(buzzer_holder(block))
      expect {
        player_orchestrator(buzzer).submit_the_scene_vote!(block: block, suggestion_id: @suggestion_a.id)
      }.to raise_error(Experiences::ForbiddenError)
    end

    it "rejects voting for own suggestion" do
      expect {
        player_orchestrator(@recipient_a).submit_the_scene_vote!(block: block, suggestion_id: @suggestion_a.id)
      }.to raise_error(ArgumentError)
    end

    it "rejects voting outside collecting phase" do
      orchestrator.end_the_scene!(block: block)
      voter = audience_voter
      expect {
        player_orchestrator(voter).submit_the_scene_vote!(block: block, suggestion_id: @suggestion_a.id)
      }.to raise_error(Experiences::InvalidTransitionError)
    end

    def audience_voter
      candidates = experience.experience_participants.where(role: "audience")
        .where.not(id: [@recipient_a.id, @recipient_b.id, buzzer_holder(block)])
      candidates.first
    end
  end

  describe "#press_the_scene_buzzer!" do
    before do
      orchestrator.start_the_scene!(block: block)
      prompts = prompt_holders(block)
      @recipient_a = experience.experience_participants.find(prompts[0])
      @recipient_b = experience.experience_participants.find(prompts[1])
      @suggestion_a = player_orchestrator(@recipient_a).submit_the_scene_suggestion!(block: block, text: "a wedding")
      @suggestion_b = player_orchestrator(@recipient_b).submit_the_scene_suggestion!(block: block, text: "a circus")
    end

    it "transitions to winner_reveal and enqueues the advance job" do
      buzzer = experience.experience_participants.find(buzzer_holder(block))
      expect {
        player_orchestrator(buzzer).press_the_scene_buzzer!(block: block)
      }.to have_enqueued_job(TheSceneAdvanceAfterRevealJob)

      payload = block.reload.payload
      expect(payload["phase"]).to eq("winner_reveal")
      expect(payload["winner_revealed_at"]).to be_present
    end

    it "rejects presses from non-buzzer-holders" do
      non_buzzer = experience.experience_participants
        .where(role: "audience")
        .where.not(id: buzzer_holder(block))
        .first
      expect {
        player_orchestrator(non_buzzer).press_the_scene_buzzer!(block: block)
      }.to raise_error(Experiences::ForbiddenError)
    end

    it "rejects when fewer than 2 suggestions exist" do
      orchestrator.clear_the_scene_suggestion!(block: block, suggestion_id: @suggestion_b.id)
      buzzer = experience.experience_participants.find(buzzer_holder(block))
      expect {
        player_orchestrator(buzzer).press_the_scene_buzzer!(block: block)
      }.to raise_error(Experiences::InvalidTransitionError)
    end

    it "rejects when not in collecting phase" do
      orchestrator.end_the_scene!(block: block)
      expect {
        player_orchestrator(player_a).press_the_scene_buzzer!(block: block)
      }.to raise_error(Experiences::InvalidTransitionError)
    end
  end

  describe "#start_next_scene! / #force_next_scene!" do
    before do
      orchestrator.start_the_scene!(block: block)
    end

    it "re-randomizes prompt and buzzer assignments and bumps scene_started_at" do
      first_stamp = block.reload.payload["scene_started_at"]
      first_prompts = prompt_holders(block)
      first_buzzer = buzzer_holder(block)

      orchestrator.start_next_scene!(block: block)
      second_stamp = block.reload.payload["scene_started_at"]

      expect(second_stamp).not_to eq(first_stamp)
      expect(second_stamp > first_stamp).to be(true)

      new_prompts = prompt_holders(block)
      new_buzzer  = buzzer_holder(block)
      expect(new_prompts).not_to include(new_buzzer)
      expect((first_prompts + [first_buzzer]).any? { |id| ![*new_prompts, new_buzzer].include?(id) }).to be_truthy
    end

    it "force_next_scene! delegates to start_next_scene!" do
      first_stamp = block.reload.payload["scene_started_at"]
      orchestrator.force_next_scene!(block: block)
      expect(block.reload.payload["scene_started_at"]).not_to eq(first_stamp)
      expect(block.reload.payload["phase"]).to eq("collecting")
    end
  end

  describe "#update_the_scene_performers!" do
    it "stores valid performer participant ids" do
      orchestrator.update_the_scene_performers!(
        block: block,
        performer_participant_ids: [player_a.id, player_b.id]
      )
      expect(block.reload.payload["performer_participant_ids"]).to contain_exactly(player_a.id, player_b.id)
    end

    it "reassigns prompts/buzzer when an active assignee becomes a performer" do
      orchestrator.start_the_scene!(block: block)
      assignee_id = prompt_holders(block).first

      orchestrator.update_the_scene_performers!(
        block: block,
        performer_participant_ids: [assignee_id]
      )

      expect(prompt_holders(block)).not_to include(assignee_id)
      expect(buzzer_holder(block)).not_to eq(assignee_id)
    end

    it "ignores unknown participant ids" do
      orchestrator.update_the_scene_performers!(
        block: block,
        performer_participant_ids: ["00000000-0000-0000-0000-000000000000"]
      )
      expect(block.reload.payload["performer_participant_ids"]).to eq([])
    end
  end

  describe "clear actions" do
    before do
      orchestrator.start_the_scene!(block: block)
      prompts = prompt_holders(block)
      @recipient_a = experience.experience_participants.find(prompts[0])
      @recipient_b = experience.experience_participants.find(prompts[1])
      @suggestion_a = player_orchestrator(@recipient_a).submit_the_scene_suggestion!(block: block, text: "a wedding")
      @suggestion_b = player_orchestrator(@recipient_b).submit_the_scene_suggestion!(block: block, text: "a circus")
      voter = experience.experience_participants.where(role: "audience")
        .where.not(id: [@recipient_a.id, @recipient_b.id, buzzer_holder(block)])
        .first
      player_orchestrator(voter).submit_the_scene_vote!(block: block, suggestion_id: @suggestion_a.id)
    end

    it "clear_top removes the highest-voted suggestion" do
      orchestrator.clear_the_scene_top!(block: block)
      expect(@suggestion_a.reload.cleared_at).to be_present
      expect(@suggestion_b.reload.cleared_at).to be_nil
    end

    it "clear_specific removes the named suggestion" do
      orchestrator.clear_the_scene_suggestion!(block: block, suggestion_id: @suggestion_b.id)
      expect(@suggestion_b.reload.cleared_at).to be_present
      expect(@suggestion_a.reload.cleared_at).to be_nil
    end

    it "clear_all removes every active suggestion" do
      orchestrator.clear_the_scene_all!(block: block)
      expect(@suggestion_a.reload.cleared_at).to be_present
      expect(@suggestion_b.reload.cleared_at).to be_present
    end
  end
end
