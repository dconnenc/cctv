require "rails_helper"

RSpec.describe Experiences::Orchestrator do
  let(:experience) { create(:experience, status: experience_status) }
  let(:user) { create(:user, :user) }
  let(:participant_role) { ExperienceParticipant.roles[:audience] }
  let(:experience_status) { Experience.statuses[:draft] }
  let!(:participant) { create(:experience_participant, user: user, experience: experience, role: participant_role) }

  describe "#reorder_block!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }
    let(:parent_block_id) { nil }

    subject do
      described_class.new(actor: user, experience: experience).reorder_block!(
        block: block_to_move,
        position: new_position
      )
    end

    let!(:block_a) do
      create(
        :experience_block,
        experience: experience,
        parent_block_id: parent_block_id,
        position: 0
      )
    end

    let!(:block_b) do
      create(
        :experience_block,
        experience: experience,
        parent_block_id: parent_block_id,
        position: 1
      )
    end

    let!(:block_c) do
      create(
        :experience_block,
        experience: experience,
        parent_block_id: parent_block_id,
        position: 2
      )
    end

    before { subject }

    context "reordering top-level blocks" do
      let(:parent_block_id) { nil }
      let(:block_to_move) { block_a }
      let(:new_position) { 2 }

      it "moves block_a to the last position and shifts others backwards" do
        expect(block_a.reload.position).to eq(2)
        expect(block_b.reload.position).to eq(0)
        expect(block_c.reload.position).to eq(1)
      end
    end

    context "re-ordering a child block among top-level blocks" do
      let(:parent_block) do
        create(:experience_block, experience: experience, position: 3)
      end

      let(:parent_block_id) { parent_block.id }

      let(:block_to_move) { block_a }
      let(:new_position) { 3 }

      it "moves the child anywhere in the experience-wide flat order" do
        # Setup before reorder: [a(0,child), b(1,child), c(2,child), parent(3,top-level)]
        # Move a to position 3: [b, c, parent, a]
        expect(block_b.reload.position).to eq(0)
        expect(block_c.reload.position).to eq(1)
        expect(parent_block.reload.position).to eq(2)
        expect(block_a.reload.position).to eq(3)
      end
    end

    context "with a position beyond the last sibling" do
      let(:block_to_move) { block_a }
      let(:new_position) { 99 }

      it "clamps to the last valid position" do
        expect(block_b.reload.position).to eq(0)
        expect(block_c.reload.position).to eq(1)
        expect(block_a.reload.position).to eq(2)
      end
    end

    context "when source and destination are the same" do
      let(:block_to_move) { block_a }
      let(:new_position) { 0 }

      it "returns the block unchanged" do
        expect(block_a.reload.position).to eq(0)
        expect(block_b.reload.position).to eq(1)
      end
    end
  end

  describe "#set_block_column!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    let!(:block_a) { create(:experience_block, experience: experience, position: 0) }
    let!(:block_b) { create(:experience_block, experience: experience, position: 1) }
    let!(:block_c) { create(:experience_block, experience: experience, position: 2) }

    it "moves only the target block's position and leaves siblings unchanged" do
      described_class.new(actor: user, experience: experience).set_block_column!(
        block: block_a,
        column: 2
      )

      expect(block_a.reload.position).to eq(2)
      expect(block_b.reload.position).to eq(1)
      expect(block_c.reload.position).to eq(2)
    end

    it "allows two blocks to share a column (simultaneity)" do
      described_class.new(actor: user, experience: experience).set_block_column!(
        block: block_a,
        column: 1
      )

      expect(block_a.reload.position).to eq(1)
      expect(block_b.reload.position).to eq(1)
    end

    it "clamps negative columns to zero" do
      described_class.new(actor: user, experience: experience).set_block_column!(
        block: block_b,
        column: -5
      )

      expect(block_b.reload.position).to eq(0)
    end
  end

  describe "#open_lobby!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    subject do
      described_class.new(actor: user, experience: experience).open_lobby!
    end

    before { subject }

    it "sets the experience status to `lobby`" do
      expect(experience.status).to eql(Experience.statuses[:lobby])
    end
  end

  describe "#start!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    subject do
      described_class.new(actor: user, experience: experience).start!
    end

    before { subject }

    it "sets the experience status to `live`" do
      expect(experience.status).to eql(Experience.statuses[:live])
    end

    it "sets the started_at time" do
      expect(experience.started_at).to be_present
    end
  end

  describe "#pause!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    subject do
      described_class.new(actor: user, experience: experience).pause!
    end

    context "when the experience can be paused" do
      let(:experience_status) { Experience.statuses[:live] }

      before { subject }

      it "sets the experience status to `paused`" do
        expect(experience.status).to eql(Experience.statuses[:paused])
      end
    end

    context "when the experience cannot be paused" do
      let(:experience_status) { Experience.statuses[:finished] }

      it "raises an invalid transition error" do
        expect { subject }.to raise_error(Experiences::InvalidTransitionError)
      end
    end
  end

  describe "#resume!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    subject do
      described_class.new(actor: user, experience: experience).resume!
    end

    context "when the experience can be resumed" do
      let(:experience_status) { Experience.statuses[:paused] }

      before { subject }

      it "sets the experience status to `live`" do
        expect(experience.status).to eql(Experience.statuses[:live])
      end
    end

    context "when the experience cannot be resumed" do
      let(:experience_status) { Experience.statuses[:live] }

      it "raises an invalid transition error" do
        expect { subject }.to raise_error(Experiences::InvalidTransitionError)
      end
    end
  end

  describe "#detach_block_from_parent!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }
    let!(:parent_block) { create(:experience_block, :family_feud, experience: experience, question_count: 2) }

    subject do
      described_class.new(actor: user, experience: experience).detach_block_from_parent!(child.id)
    end

    let(:child) { parent_block.child_blocks.first }

    it "nulls parent_block_id and removes the depends_on link" do
      expect(child.parent_block_id).to eq(parent_block.id)
      subject

      expect(child.reload.parent_block_id).to be_nil
      expect(ExperienceBlockLink.where(child_block_id: child.id)).to be_empty
    end

    context "when the block already has no parent" do
      let(:child) { create(:experience_block, experience: experience) }

      it "is a no-op" do
        expect { subject }.not_to raise_error
        expect(child.reload.parent_block_id).to be_nil
      end
    end
  end

  describe "Guess Who block" do
    let(:experience_status) { Experience.statuses[:live] }
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    let!(:contestant_a) { create(:experience_participant, :audience, experience: experience) }
    let!(:contestant_b) { create(:experience_participant, :audience, experience: experience) }
    let!(:pool_member_c) { create(:experience_participant, :audience, experience: experience) }
    let!(:pool_member_d) { create(:experience_participant, :audience, experience: experience) }
    let!(:pool_member_e) { create(:experience_participant, :audience, experience: experience) }

    let(:pool_segment) do
      seg = experience.experience_segments.create!(name: "audience-pool", color: "#6B7280", position: 0)
      [contestant_a, contestant_b, pool_member_c, pool_member_d, pool_member_e].each do |p|
        ExperienceParticipantSegment.create!(experience_participant: p, experience_segment: seg)
      end
      seg
    end

    let(:contestant_segment) do
      seg = experience.experience_segments.create!(name: "contestants", color: "#6B7280", position: 1)
      [contestant_a, contestant_b].each do |p|
        ExperienceParticipantSegment.create!(experience_participant: p, experience_segment: seg)
      end
      seg
    end

    let!(:question_block) do
      create(:experience_block, experience: experience, kind: ExperienceBlock::QUESTION,
        payload: { "question" => "Favorite color?" }, position: 0)
    end

    let!(:question_submissions) do
      [contestant_a, contestant_b, pool_member_c, pool_member_d, pool_member_e].map do |p|
        create(:experience_question_submission,
          experience_block: question_block,
          experience_participant: p,
          answer: { "value" => "blue-#{p.id[0..3]}" }
        )
      end
    end

    let(:guess_who_block) do
      create(:experience_block, experience: experience, kind: ExperienceBlock::GUESS_WHO,
        payload: {
          "segment_id" => pool_segment.id,
          "contestant_segment_id" => contestant_segment.id,
          "eligibility_threshold" => 0.10,
          "monitor_view" => "idle",
          "revealed" => false,
          "started" => false,
          "contestants" => [],
          "active_poll_block_id" => nil,
          "active_poll_contestant_index" => nil
        }, position: 1)
    end

    let(:orchestrator) { described_class.new(actor: user, experience: experience) }

    describe "#start_guess_who!" do
      subject { orchestrator.start_guess_who!(block: guess_who_block) }

      context "when contestant segment has exactly 2 members" do
        before { subject }

        it "marks the block as started" do
          expect(guess_who_block.reload.payload["started"]).to eq(true)
        end

        it "assigns contestants from the contestant segment" do
          ids = guess_who_block.reload.payload["contestants"].map { |c| c["contestant_user_id"] }
          expect(ids).to contain_exactly(contestant_a.user_id, contestant_b.user_id)
        end

        it "selects two distinct mystery participants from the pool, excluding contestants" do
          mystery_ids = guess_who_block.reload.payload["contestants"].map { |c| c["mystery_user_id"] }
          expect(mystery_ids.uniq.length).to eq(2)
          expect(mystery_ids).not_to include(contestant_a.user_id, contestant_b.user_id)
        end

        it "builds clues from the mystery participant's prior submissions" do
          guess_who_block.reload.payload["contestants"].each do |c|
            expect(c["clues"]).to be_an(Array).and(be_present)
          end
        end

        it "excludes the mystery person from board_candidate_ids" do
          guess_who_block.reload.payload["contestants"].each do |c|
            expect(c["board_candidate_ids"]).not_to include(c["mystery_user_id"])
          end
        end
      end

      context "when contestant segment does not have exactly 2 members" do
        before { ExperienceParticipantSegment.where(experience_segment_id: contestant_segment.id).delete_all }

        it "raises InvalidTransitionError" do
          expect { subject }.to raise_error(Experiences::InvalidTransitionError)
        end
      end
    end

    describe "#reroll_guess_who_mystery!" do
      before { orchestrator.start_guess_who!(block: guess_who_block) }

      subject { orchestrator.reroll_guess_who_mystery!(block: guess_who_block, contestant_index: 0) }

      it "replaces the mystery for the given contestant index" do
        original = guess_who_block.reload.payload["contestants"][0]["mystery_user_id"]
        subject
        expect(guess_who_block.reload.payload["contestants"][0]["mystery_user_id"]).not_to eq(original)
      end

      it "does not change the other contestant's mystery" do
        original = guess_who_block.reload.payload["contestants"][1]["mystery_user_id"]
        subject
        expect(guess_who_block.reload.payload["contestants"][1]["mystery_user_id"]).to eq(original)
      end
    end

    describe "#set_guess_who_monitor_view!" do
      before { orchestrator.start_guess_who!(block: guess_who_block) }

      context "with a valid view" do
        subject { orchestrator.set_guess_who_monitor_view!(block: guess_who_block, view: "c1_board") }

        before { subject }

        it "updates monitor_view" do
          expect(guess_who_block.reload.payload["monitor_view"]).to eq("c1_board")
        end
      end

      context "with an invalid view" do
        it "raises ArgumentError" do
          expect {
            orchestrator.set_guess_who_monitor_view!(block: guess_who_block, view: "bogus")
          }.to raise_error(ArgumentError)
        end
      end
    end

    describe "#dispatch_guess_who_poll!" do
      before { orchestrator.start_guess_who!(block: guess_who_block) }

      subject { orchestrator.dispatch_guess_who_poll!(block: guess_who_block, contestant_index: 0) }

      context "when no poll is currently active" do
        before { subject }

        it "creates a child True/False poll block" do
          poll = ExperienceBlock.find(guess_who_block.reload.payload["active_poll_block_id"])
          expect(poll.kind).to eq(ExperienceBlock::POLL)
          expect(poll.payload["options"]).to eq(["True", "False"])
          expect(poll.parent_block_id).to eq(guess_who_block.id)
        end

        it "tracks the active poll and contestant index in the payload" do
          payload = guess_who_block.reload.payload
          expect(payload["active_poll_block_id"]).to be_present
          expect(payload["active_poll_contestant_index"]).to eq(0)
        end
      end

      context "when a poll is already active" do
        before { subject }

        it "raises InvalidTransitionError" do
          expect {
            orchestrator.dispatch_guess_who_poll!(block: guess_who_block, contestant_index: 1)
          }.to raise_error(Experiences::InvalidTransitionError)
        end
      end
    end

    describe "#conclude_guess_who_poll!" do
      before do
        orchestrator.start_guess_who!(block: guess_who_block)
        orchestrator.dispatch_guess_who_poll!(block: guess_who_block, contestant_index: 0)
      end

      let(:poll_id) { guess_who_block.reload.payload["active_poll_block_id"] }
      let(:mystery_user_id) { guess_who_block.reload.payload["contestants"][0]["mystery_user_id"] }
      let(:candidate_ids) { guess_who_block.reload.payload["contestants"][0]["board_candidate_ids"] }
      let(:mystery_participant) { experience.experience_participants.find_by(user_id: mystery_user_id) }
      let(:candidates_by_user_id) do
        experience.experience_participants.where(user_id: candidate_ids).index_by(&:user_id)
      end

      context "when the mystery participant has responded" do
        let(:matched_uid) { candidate_ids.first }
        let(:differed_uid) { candidate_ids.last }
        let(:non_responding_uids) { candidate_ids - [matched_uid, differed_uid] }

        before do
          ExperiencePollSubmission.create!(
            experience_block_id: poll_id,
            experience_participant: mystery_participant,
            answer: { "selectedOptions" => ["True"] }
          )
          ExperiencePollSubmission.create!(
            experience_block_id: poll_id,
            experience_participant: candidates_by_user_id[matched_uid],
            answer: { "selectedOptions" => ["True"] }
          )
          ExperiencePollSubmission.create!(
            experience_block_id: poll_id,
            experience_participant: candidates_by_user_id[differed_uid],
            answer: { "selectedOptions" => ["False"] }
          )
          orchestrator.conclude_guess_who_poll!(block: guess_who_block)
        end

        let(:contestant_payload) { guess_who_block.reload.payload["contestants"][0] }

        it "eliminates candidates whose answer differs from the mystery's" do
          expect(contestant_payload["eliminated_user_ids"]).to include(differed_uid)
          expect(contestant_payload["eliminated_user_ids"]).not_to include(matched_uid)
        end

        it "marks non-responding candidates as unanswered" do
          expect(contestant_payload["unanswered_user_ids"]).to match_array(non_responding_uids)
        end

        it "clears the active poll" do
          expect(guess_who_block.reload.payload["active_poll_block_id"]).to be_nil
        end
      end

      context "when the mystery participant has not responded" do
        before do
          ExperiencePollSubmission.create!(
            experience_block_id: poll_id,
            experience_participant: candidates_by_user_id[candidate_ids.first],
            answer: { "selectedOptions" => ["True"] }
          )
          orchestrator.conclude_guess_who_poll!(block: guess_who_block)
        end

        let(:contestant_payload) { guess_who_block.reload.payload["contestants"][0] }

        it "clears the active poll" do
          expect(guess_who_block.reload.payload["active_poll_block_id"]).to be_nil
        end

        it "does not eliminate any candidates (no mystery answer to compare against)" do
          expect(contestant_payload["eliminated_user_ids"]).to be_empty
        end
      end
    end

    describe "#set_guess_who_theme_music!" do
      before { orchestrator.start_guess_who!(block: guess_who_block) }

      it "toggles theme_music_playing on and off" do
        orchestrator.set_guess_who_theme_music!(block: guess_who_block, playing: true)
        expect(guess_who_block.reload.payload["theme_music_playing"]).to be(true)

        orchestrator.set_guess_who_theme_music!(block: guess_who_block, playing: false)
        expect(guess_who_block.reload.payload["theme_music_playing"]).to be(false)
      end

      it "raises when the block is not a Guess Who" do
        expect {
          orchestrator.set_guess_who_theme_music!(block: question_block, playing: true)
        }.to raise_error(ArgumentError)
      end
    end

    describe "#restart_guess_who_theme_music!" do
      before { orchestrator.start_guess_who!(block: guess_who_block) }

      it "forces playing on and increments restart count each call" do
        orchestrator.restart_guess_who_theme_music!(block: guess_who_block)
        payload = guess_who_block.reload.payload
        expect(payload["theme_music_playing"]).to be(true)
        expect(payload["theme_music_restart_count"]).to eq(1)

        orchestrator.restart_guess_who_theme_music!(block: guess_who_block)
        expect(guess_who_block.reload.payload["theme_music_restart_count"]).to eq(2)
      end

      it "raises when the block is not a Guess Who" do
        expect {
          orchestrator.restart_guess_who_theme_music!(block: question_block)
        }.to raise_error(ArgumentError)
      end
    end

    describe "#reveal_guess_who!" do
      before { orchestrator.start_guess_who!(block: guess_who_block) }

      subject { orchestrator.reveal_guess_who!(block: guess_who_block) }

      before { subject }

      it "marks the game as revealed" do
        expect(guess_who_block.reload.payload["revealed"]).to eq(true)
      end

      it "switches monitor_view to reveal" do
        expect(guess_who_block.reload.payload["monitor_view"]).to eq("reveal")
      end
    end
  end

  describe "#update_family_feud_ai_context!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }
    let!(:block) { create(:experience_block, :family_feud, experience: experience) }

    subject do
      described_class.new(actor: user, experience: experience).update_family_feud_ai_context!(
        block: block,
        ai_context: "Corporate event for a tech audience"
      )
    end

    it "stores the ai_context in the block payload" do
      subject
      expect(block.reload.payload["ai_context"]).to eql("Corporate event for a tech audience")
    end

    it "strips leading and trailing whitespace" do
      described_class.new(actor: user, experience: experience).update_family_feud_ai_context!(
        block: block,
        ai_context: "  padded context  "
      )
      expect(block.reload.payload["ai_context"]).to eql("padded context")
    end

    it "preserves other payload fields" do
      block.update!(payload: block.payload.merge("title" => "My Game"))
      subject
      expect(block.reload.payload["title"]).to eql("My Game")
    end
  end

  describe "#update_family_feud_question_ai_context!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }
    let!(:block) { create(:experience_block, :family_feud, experience: experience) }
    let(:question_block) { block.child_blocks.first }

    subject do
      described_class.new(actor: user, experience: experience).update_family_feud_question_ai_context!(
        question_id: question_block.id,
        ai_context: "Focus on food categories"
      )
    end

    it "stores the ai_context in the question block payload" do
      subject
      expect(question_block.reload.payload["ai_context"]).to eql("Focus on food categories")
    end

    it "preserves existing question payload fields" do
      subject
      expect(question_block.reload.payload["question"]).to be_present
    end
  end

  describe "#auto_categorize_family_feud!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }
    let!(:block) { create(:experience_block, :family_feud, experience: experience) }

    let(:question_block) { block.child_blocks.first }

    let(:ai_response) do
      {
        "buckets" => [
          { "name" => "Home Life", "answer_ids" => [submission_a.id.to_s, submission_b.id.to_s] },
          { "name" => "Work Stuff", "answer_ids" => [submission_c.id.to_s] }
        ]
      }
    end

    let!(:submission_a) do
      create(:experience_question_submission, experience_block: question_block, experience_participant: participant, answer: { "value" => "cooking" })
    end
    let!(:submission_b) do
      create(:experience_question_submission, experience_block: question_block, experience_participant: participant, answer: { "value" => "cleaning" })
    end
    let!(:submission_c) do
      create(:experience_question_submission, experience_block: question_block, experience_participant: participant, answer: { "value" => "meetings" })
    end

    before do
      allow(AI::Client).to receive(:call).and_return(ai_response)
    end

    subject do
      described_class.new(actor: user, experience: experience).auto_categorize_family_feud!(
        question_id: question_block.id
      )
    end

    it "creates buckets from the AI response" do
      subject
      buckets = question_block.reload.payload["buckets"]
      expect(buckets.length).to eq(2)
      expect(buckets.map { |b| b["name"] }).to contain_exactly("Home Life", "Work Stuff")
    end

    it "caps the board at 8 buckets, keeping the largest and dropping the overflow" do
      orchestrator = described_class.new(actor: user, experience: experience)
      buckets = (0..9).map do |i|
        size = [4, 9].include?(i) ? 1 : 3
        { "id" => "b#{i}", "name" => "b#{i}", "answer_ids" => Array.new(size, "x") }
      end

      result = orchestrator.send(:cap_family_feud_buckets, buckets)

      expect(result.length).to eq(8)
      expect(result.map { |b| b["name"] }).not_to include("b4", "b9")
    end

    it "passes game_context and question_context to the prompt builder when set" do
      block.update!(payload: block.payload.merge("ai_context" => "Tech company event"))
      question_block.update!(payload: question_block.payload.merge("ai_context" => "Focus on workplace themes"))

      prompt_builder = instance_double(
        AI::Prompts::FamilyFeudBucketing,
        prompt: "prompt text",
        response_schema: {}
      )

      expect(AI::Prompts::FamilyFeudBucketing).to receive(:new).with(
        question_text: anything,
        answers: anything,
        game_context: "Tech company event",
        question_context: "Focus on workplace themes"
      ).and_return(prompt_builder)

      subject
    end

    it "passes nil contexts when not set" do
      prompt_builder = instance_double(
        AI::Prompts::FamilyFeudBucketing,
        prompt: "prompt text",
        response_schema: {}
      )

      expect(AI::Prompts::FamilyFeudBucketing).to receive(:new).with(
        question_text: anything,
        answers: anything,
        game_context: nil,
        question_context: nil
      ).and_return(prompt_builder)

      subject
    end
  end

  describe "#generate_family_feud_synthetic_answers!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }
    let!(:block) { create(:experience_block, :family_feud, experience: experience, question_count: 1) }
    let(:question_block) { block.child_blocks.first }

    let(:ai_response) { { "answers" => ["pizza", "tacos", "pizza", "sushi"] } }

    before do
      question_block.update!(payload: question_block.payload.merge("synthetic" => true, "question" => ""))
      allow(AI::Client).to receive(:call).and_return(ai_response)
    end

    subject do
      described_class.new(actor: user, experience: experience).generate_family_feud_synthetic_answers!(
        question_id: question_block.id,
        question_text: "Name a food",
        count: 4
      )
    end

    it "creates an AI-generated submission per answer with no participant" do
      expect { subject }.to change { ExperienceQuestionSubmission.where(experience_block_id: question_block.id).count }.from(0).to(4)

      submissions = ExperienceQuestionSubmission.where(experience_block_id: question_block.id)
      expect(submissions.map(&:source).uniq).to eq([ExperienceQuestionSubmission::AI_GENERATED_SOURCE])
      expect(submissions.map(&:experience_participant_id).uniq).to eq([nil])
      expect(submissions.map { |s| s.answer["value"] }).to contain_exactly("pizza", "tacos", "pizza", "sushi")
    end

    it "persists the question text and returns the generated answers" do
      result = subject
      expect(question_block.reload.payload["question"]).to eq("Name a food")
      expect(result.map { |a| a["text"] }).to contain_exactly("pizza", "tacos", "pizza", "sushi")
    end

    it "replaces prior answers and resets buckets when regenerating (reroll)" do
      old = create(:experience_question_submission, experience_block: question_block, experience_participant: participant, answer: { "value" => "stale" })
      question_block.update!(payload: question_block.payload.merge("buckets" => [{ "id" => "b1", "name" => "Old", "answer_ids" => [old.id.to_s] }]))

      subject

      expect(ExperienceQuestionSubmission.where(id: old.id)).to be_empty
      expect(question_block.reload.payload["buckets"]).to eq([])
      expect(ExperienceQuestionSubmission.where(experience_block_id: question_block.id).count).to eq(4)
    end

    it "passes game and question context to the generation prompt" do
      block.update!(payload: block.payload.merge("ai_context" => "Food festival"))
      question_block.update!(payload: question_block.payload.merge("ai_context" => "Street food only"))

      prompt_builder = instance_double(AI::Prompts::FamilyFeudAnswerGeneration, prompt: "p", response_schema: {})
      expect(AI::Prompts::FamilyFeudAnswerGeneration).to receive(:new).with(
        question_text: "Name a food",
        count: 4,
        game_context: "Food festival",
        question_context: "Street food only"
      ).and_return(prompt_builder)

      subject
    end

    it "caps the requested count at MAX_SYNTHETIC_ANSWERS" do
      prompt_builder = instance_double(AI::Prompts::FamilyFeudAnswerGeneration, prompt: "p", response_schema: {})
      expect(AI::Prompts::FamilyFeudAnswerGeneration).to receive(:new).with(
        hash_including(count: Experiences::Orchestrator::MAX_SYNTHETIC_ANSWERS)
      ).and_return(prompt_builder)

      described_class.new(actor: user, experience: experience).generate_family_feud_synthetic_answers!(
        question_id: question_block.id,
        question_text: "Name a food",
        count: 5000
      )
    end

    it "raises when the question text is blank" do
      expect {
        described_class.new(actor: user, experience: experience).generate_family_feud_synthetic_answers!(
          question_id: question_block.id,
          question_text: "  ",
          count: 4
        )
      }.to raise_error(AI::Client::Error)
    end

    it "raises when the block is not a synthetic question" do
      question_block.update!(payload: question_block.payload.merge("synthetic" => false))

      expect {
        described_class.new(actor: user, experience: experience).generate_family_feud_synthetic_answers!(
          question_id: question_block.id,
          question_text: "Name a food",
          count: 4
        )
      }.to raise_error(ArgumentError)
    end
  end

  describe "#start_family_feud_playing!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }
    let!(:block) do
      create(
        :experience_block,
        :family_feud,
        experience: experience,
        status: :open,
        question_count: 2
      )
    end

    subject do
      described_class.new(actor: user, experience: experience).start_family_feud_playing!(
        block: block
      )
    end

    context "when child questions were broadcast and closed before FamilyFeud plays" do
      let(:participant) do
        ExperienceParticipant.find_by(experience_id: experience.id, user_id: user.id) ||
          create(:experience_participant, user: user, experience: experience)
      end

      before do
        block.child_blocks.each_with_index do |child, idx|
          child.update!(payload: child.payload.merge("buckets" => [
            { "id" => "b#{idx}", "name" => "Bucket #{idx}", "answer_ids" => [] }
          ]))
          create(:experience_question_submission, experience_block: child, experience_participant: participant)
          child.close!
        end
      end

      it "still snapshots child responses into the parent payload regardless of child status" do
        subject

        game_state = block.reload.payload["game_state"]
        expect(game_state["phase"]).to eq("playing")
        expect(game_state["questions"].length).to eq(2)
        expect(block.child_blocks.map(&:status)).to all(eq("closed"))
      end
    end
  end

  describe "#open_block!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    subject do
      described_class.new(actor: user, experience: experience).open_block!(block: block)
    end

    context "when opening a family feud block" do
      let!(:block) do
        create(
          :experience_block,
          :family_feud,
          experience: experience,
          status: :hidden,
          question_count: 2
        )
      end

      it "opens the parent and all child question blocks atomically" do
        subject

        expect(block.reload.status).to eq("open")
        expect(block.child_blocks.count).to eq(2)
        expect(block.child_blocks.map(&:status)).to all(eq("open"))
      end
    end

    context "when opening a guess who block" do
      let!(:block) do
        create(:experience_block, kind: ExperienceBlock::GUESS_WHO, experience: experience, status: :hidden)
      end

      let!(:child_poll) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::POLL, status: :closed, parent_block_id: block.id)
      end

      it "opens the parent only, leaving child polls unaffected" do
        subject

        expect(block.reload.status).to eq("open")
        expect(child_poll.reload.status).to eq("closed")
      end
    end

    context "when opening a guess who child poll block" do
      let!(:block) do
        create(:experience_block, kind: ExperienceBlock::GUESS_WHO, experience: experience, status: :hidden)
      end

      let!(:child_poll) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::POLL, status: :closed, parent_block_id: block.id)
      end

      it "opens the parent and all children atomically" do
        described_class.new(actor: user, experience: experience).open_block!(block: child_poll)

        expect(block.reload.status).to eq("open")
        expect(child_poll.reload.status).to eq("open")
      end
    end
  end

  describe "#close_block!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    subject do
      described_class.new(actor: user, experience: experience).close_block!(block: block)
    end

    context "when closing a family feud parent block" do
      let!(:block) do
        create(
          :experience_block,
          :family_feud,
          experience: experience,
          status: :open,
          question_count: 2
        )
      end

      it "closes the parent and all child question blocks atomically" do
        subject

        expect(block.reload.status).to eq("closed")
        expect(block.child_blocks.count).to eq(2)
        expect(block.child_blocks.map(&:status)).to all(eq("closed"))
      end
    end

    context "when closing a family feud child block" do
      let!(:block) do
        create(
          :experience_block,
          :family_feud,
          experience: experience,
          status: :open,
          question_count: 2
        )
      end

      it "closes the parent and all siblings atomically" do
        child = block.child_blocks.first
        described_class.new(actor: user, experience: experience).close_block!(block: child)

        expect(block.reload.status).to eq("closed")
        expect(block.child_blocks.map(&:status)).to all(eq("closed"))
      end
    end

    context "when closing a guess who parent block" do
      let!(:block) do
        create(:experience_block, kind: ExperienceBlock::GUESS_WHO, experience: experience, status: :open)
      end

      let!(:child_poll_1) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::POLL, status: :open, parent_block_id: block.id)
      end

      let!(:child_poll_2) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::POLL, status: :closed, parent_block_id: block.id)
      end

      it "closes the parent and all child polls atomically" do
        subject

        expect(block.reload.status).to eq("closed")
        expect(child_poll_1.reload.status).to eq("closed")
        expect(child_poll_2.reload.status).to eq("closed")
      end
    end

    context "when closing a guess who child poll block" do
      let!(:block) do
        create(:experience_block, kind: ExperienceBlock::GUESS_WHO, experience: experience, status: :open)
      end

      let!(:child_poll_1) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::POLL, status: :open, parent_block_id: block.id)
      end

      let!(:child_poll_2) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::POLL, status: :open, parent_block_id: block.id)
      end

      it "closes the parent and all siblings atomically" do
        described_class.new(actor: user, experience: experience).close_block!(block: child_poll_1)

        expect(block.reload.status).to eq("closed")
        expect(child_poll_1.reload.status).to eq("closed")
        expect(child_poll_2.reload.status).to eq("closed")
      end
    end
  end

  describe "#hide_block!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    subject do
      described_class.new(actor: user, experience: experience).hide_block!(block: block)
    end

    context "when hiding a family feud parent block" do
      let!(:block) do
        create(
          :experience_block,
          :family_feud,
          experience: experience,
          status: :open,
          question_count: 2
        )
      end

      it "hides the parent and all child question blocks atomically" do
        subject

        expect(block.reload.status).to eq("hidden")
        expect(block.child_blocks.count).to eq(2)
        expect(block.child_blocks.map(&:status)).to all(eq("hidden"))
      end
    end

    context "when hiding a family feud child block" do
      let!(:block) do
        create(
          :experience_block,
          :family_feud,
          experience: experience,
          status: :open,
          question_count: 2
        )
      end

      it "hides the parent and all siblings atomically" do
        child = block.child_blocks.first
        described_class.new(actor: user, experience: experience).hide_block!(block: child)

        expect(block.reload.status).to eq("hidden")
        expect(block.child_blocks.map(&:status)).to all(eq("hidden"))
      end
    end

    context "when hiding a guess who parent block" do
      let!(:block) do
        create(:experience_block, kind: ExperienceBlock::GUESS_WHO, experience: experience, status: :open)
      end

      let!(:child_poll_1) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::POLL, status: :open, parent_block_id: block.id)
      end

      let!(:child_poll_2) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::POLL, status: :closed, parent_block_id: block.id)
      end

      it "hides the parent and all child polls atomically" do
        subject

        expect(block.reload.status).to eq("hidden")
        expect(child_poll_1.reload.status).to eq("hidden")
        expect(child_poll_2.reload.status).to eq("hidden")
      end
    end

    context "when hiding a guess who child poll block" do
      let!(:block) do
        create(:experience_block, kind: ExperienceBlock::GUESS_WHO, experience: experience, status: :open)
      end

      let!(:child_poll_1) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::POLL, status: :open, parent_block_id: block.id)
      end

      let!(:child_poll_2) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::POLL, status: :open, parent_block_id: block.id)
      end

      it "hides the parent and all siblings atomically" do
        described_class.new(actor: user, experience: experience).hide_block!(block: child_poll_1)

        expect(block.reload.status).to eq("hidden")
        expect(child_poll_1.reload.status).to eq("hidden")
        expect(child_poll_2.reload.status).to eq("hidden")
      end
    end
  end

  describe "#delete_block!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    subject do
      described_class.new(actor: user, experience: experience).delete_block!(block.id)
    end

    context "when deleting a top-level block" do
      let!(:block) do
        create(:experience_block, experience: experience, status: :hidden)
      end

      it "removes the block from the experience" do
        block_id = block.id
        subject

        expect(ExperienceBlock.find_by(id: block_id)).to be_nil
      end
    end

    context "when deleting a FamilyFeud block with child questions" do
      let!(:block) do
        create(
          :experience_block,
          :family_feud,
          experience: experience,
          status: :hidden,
          question_count: 2
        )
      end

      it "removes the parent and its child question blocks" do
        block_id = block.id
        child_ids = block.child_blocks.pluck(:id)

        subject

        expect(ExperienceBlock.find_by(id: block_id)).to be_nil
        expect(ExperienceBlock.where(id: child_ids)).to be_empty
      end
    end
  end

  describe "#add_block!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }
    let(:kind) { "poll" }
    let(:payload) { { question: "Test question?" } }
    let(:visible_to_roles) { [] }
    let(:target_user_ids) { [] }
    let(:status) { :hidden }
    let(:open_immediately) { false }
    let(:show_in_lobby) { false }

    subject do
      described_class.new(actor: user, experience: experience).add_block!(
        kind: kind,
        payload: payload,
        visible_to_roles: visible_to_roles,
        target_user_ids: target_user_ids,
        status: status,
        open_immediately: open_immediately,
        show_in_lobby: show_in_lobby
      )
    end

    it "returns a persisted block with the specified configuration" do
      block = subject
      expect(block).to be_persisted
      expect(block.kind).to eq(kind)
      expect(block.payload).to eq(payload.stringify_keys)
      expect(block.status).to eq(status.to_s)
      expect(block.experience).to eq(experience)
    end

    it "positions the block after existing blocks" do
      create(:experience_block, experience: experience, position: 5)
      block = subject
      expect(block.position).to eq(6)
    end

    context "when open_immediately is true" do
      let(:open_immediately) { true }

      it "opens the block immediately" do
        block = subject
        expect(block.status).to eq("open")
      end
    end

    context "when visibility restrictions are specified" do
      let(:visible_to_roles) { ["host", "moderator"] }
      let(:target_user_ids) { [user.id] }

      it "applies the visibility restrictions" do
        block = subject
        expect(block.visible_to_roles).to eq(visible_to_roles)
        expect(block.target_user_ids).to eq(target_user_ids)
      end
    end
  end

  shared_examples "a submission method" do |method_name, block_kind, submission_class, submission_factory|
    let(:experience_status) { Experience.statuses[:live] }
    let(:block_status) { "open" }
    let(:participant_role) { ExperienceParticipant.roles[:audience] }

    let(:block) do
      create(
        :experience_block,
        experience: experience,
        kind: block_kind,
        status: block_status
      )
    end

    subject do
      described_class.new(actor: user, experience: experience).public_send(
        method_name,
        block: block,
        answer: answer
      )
    end

    context "when the user is a participant and block has no visibility restrictions" do
      it "returns a persisted submission with the user's answer" do
        submission = subject
        expect(submission).to be_persisted
        expect(submission).to be_a(submission_class)
        expect(submission.answer).to eq(answer)
        expect(submission.experience_participant).to eq(participant)
        expect(submission.experience_block).to eq(block)
      end
    end

    context "when updating an existing submission" do
      let(:old_answer) { { "name" => "old_name" } }

      before do
        create(submission_factory, experience_block: block, experience_participant: participant, answer: old_answer)
      end

      it "updates the existing submission with the new answer" do
        submission = subject
        expect(submission.answer).to eq(answer)
        expect(submission_class.where(experience_participant: participant, experience_block: block).count).to eq(1)
      end
    end
  end

  describe "#submit_poll_response!" do
    let(:answer) { { "selectedOptions" => ["option_a"], "submittedAt" => "2026-01-01T00:00:00.000Z" } }

    it_behaves_like "a submission method",
      :submit_poll_response!,
      "poll",
      ExperiencePollSubmission,
      :experience_poll_submission

    context "when the poll has segment assignments" do
      let(:segment) { experience.experience_segments.create!(name: "Team A", color: "#FF0000", position: 0) }
      let!(:block) do
        create(:experience_block, experience: experience, kind: "poll", status: :open, payload: {
          "question" => "Pick a team",
          "options" => ["option_a"],
          "pollType" => "single",
          "segmentAssignments" => { "option_a" => segment.id }
        })
      end

      it "records a profile change with the old fingerprint" do
        old_fingerprint = Experiences::Broadcaster.visibility_fingerprint(experience, participant)

        orchestrator = described_class.new(actor: user, experience: experience)
        orchestrator.submit_poll_response!(block: block, answer: answer)

        expect(orchestrator.profile_changes).to eq([
          { participant: participant, old_fingerprint: old_fingerprint }
        ])
      end
    end

  end

  describe "#submit_question_response!" do
    let(:answer) { "answer text" }

    it_behaves_like "a submission method",
      :submit_question_response!,
      "question",
      ExperienceQuestionSubmission,
      :experience_question_submission
  end

  describe "#update_block!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    subject do
      described_class.new(actor: user, experience: experience).update_block!(
        block: block,
        payload: new_payload,
        visible_to_segment_ids: [],
        questions: questions
      )
    end

    let(:questions) { nil }

    context "updating a simple block" do
      let(:block) { create(:experience_block, :announcement, experience: experience) }
      let(:new_payload) { { "message" => "Updated" } }

      it "updates the block payload" do
        subject
        block.reload
        expect(block.payload["message"]).to eql("Updated")
      end

      it "updates segment associations" do
        segment = experience.experience_segments.create!(name: "Test", color: "#000", position: 0)
        described_class.new(actor: user, experience: experience).update_block!(
          block: block,
          payload: new_payload,
          visible_to_segment_ids: [segment.id]
        )
        block.reload
        expect(block.experience_segment_ids).to include(segment.id)
      end
    end

    context "poll options changed with submissions" do
      let(:block) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::POLL,
          payload: { "question" => "Q?", "options" => ["a", "b"], "pollType" => "single" }
        )
      end
      let(:new_payload) { { "question" => "Q?", "options" => ["a", "c"], "pollType" => "single" } }

      before { create(:experience_poll_submission, experience_block: block, experience_participant: participant) }

      it "clears submissions and saves" do
        expect { subject }.to change { ExperiencePollSubmission.count }.by(-1)
        expect(block.reload.payload["options"]).to include("c")
      end
    end

    context "poll options unchanged with submissions (question text changed)" do
      let(:block) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::POLL,
          payload: { "question" => "Old Q?", "options" => ["a", "b"], "pollType" => "single" }
        )
      end
      let(:new_payload) { { "question" => "New Q?", "options" => ["a", "b"], "pollType" => "single" } }

      before { create(:experience_poll_submission, experience_block: block, experience_participant: participant) }

      it "updates the question text" do
        subject
        block.reload
        expect(block.payload["question"]).to eql("New Q?")
      end
    end

    context "family feud with child submissions" do
      let(:block) { create(:experience_block, :family_feud, experience: experience) }
      let(:new_payload) { { "title" => "Updated" } }

      before do
        child = block.child_blocks.first
        create(:experience_question_submission, experience_block: child, experience_participant: participant)
      end

      it "allows the edit" do
        expect { subject }.not_to raise_error
        expect(block.reload.payload["title"]).to eql("Updated")
      end
    end

    context "propagating family feud question text to child blocks" do
      let(:block) do
        create(:experience_block, :family_feud, experience: experience, status: ExperienceBlock::HIDDEN)
      end
      let(:child) { block.child_blocks.first }
      let(:new_payload) { { "title" => "New Title" } }
      let(:questions) { [{ id: child.id, question: "Updated question" }] }

      it "updates the child block payload" do
        subject
        child.reload
        expect(child.payload["question"]).to eql("Updated question")
      end
    end
  end
end
