require "rails_helper"

RSpec.describe Experiences::Orchestrator do
  let(:experience) { create(:experience, status: experience_status) }
  let(:user) { create(:user, :user) }
  let(:participant_role) { ExperienceParticipant.roles[:audience] }
  let(:experience_status) { Experience.statuses[:draft] }

  before do
    create(
      :experience_participant,
      user: user,
      experience: experience,
      role: participant_role
    )
  end

  describe "#reorder_block!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }
    let(:parent_block_id) { nil }

    subject do
      described_class.new(actor: user, experience: experience).reorder_block!(
        block_id: block_to_move.id,
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

    context "re-ordering child blocks" do
      let(:parent_block) do
        create(:experience_block, experience: experience, position: 0)
      end

      let(:parent_block_id) { parent_block.id }

      let(:block_to_move) { block_a }
      let(:new_position) { 2 }

      it "reorders children within their sibling group without affecting the parent" do
        expect(block_a.reload.position).to eq(2)
        expect(block_b.reload.position).to eq(0)
        expect(block_c.reload.position).to eq(1)
        expect(parent_block.reload.position).to eq(0)
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

  describe "#open_block!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    subject do
      described_class.new(actor: user, experience: experience).open_block!(block.id)
    end

    context "when opening a family feud block with child question blocks" do
      let!(:block) do
        create(
          :experience_block,
          :family_feud,
          experience: experience,
          status: :hidden,
          question_count: 2
        )
      end

      it "opens the parent block and all child question blocks" do
        subject

        expect(block.reload.status).to eq("open")
        expect(block.child_blocks.count).to eq(2)
        expect(block.child_blocks.map(&:status)).to all(eq("open"))
      end
    end
  end

  describe "#close_block!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    subject do
      described_class.new(actor: user, experience: experience).close_block!(block.id)
    end

    context "when closing a parent block with children" do
      let!(:block) do
        create(
          :experience_block,
          :family_feud,
          experience: experience,
          status: :open,
          question_count: 2
        )
      end

      it "closes the parent block and all child blocks" do
        subject

        expect(block.reload.status).to eq("closed")
        expect(block.child_blocks.count).to eq(2)
        expect(block.child_blocks.map(&:status)).to all(eq("closed"))
      end
    end
  end

  describe "#hide_block!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    subject do
      described_class.new(actor: user, experience: experience).hide_block!(block.id)
    end

    context "when hiding a parent block with children" do
      let!(:block) do
        create(
          :experience_block,
          :family_feud,
          experience: experience,
          status: :open,
          question_count: 2
        )
      end

      it "hides the parent block and all child blocks" do
        subject

        expect(block.reload.status).to eq("hidden")
        expect(block.child_blocks.count).to eq(2)
        expect(block.child_blocks.map(&:status)).to all(eq("hidden"))
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

  describe "#add_block_with_dependencies!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }
    let(:kind) { "mad_lib" }
    let(:payload) { { template: "Hello {name}!" } }
    let(:visible_to_roles) { [] }
    let(:target_user_ids) { [] }
    let(:status) { :hidden }
    let(:variables) { [] }

    subject do
      described_class.new(actor: user, experience: experience).add_block_with_dependencies!(
        kind: kind,
        payload: payload,
        visible_to_roles: visible_to_roles,
        target_user_ids: target_user_ids,
        status: status,
        variables: variables
      )
    end

    context "with no variables" do
      it "returns a persisted parent block" do
        block = subject
        expect(block).to be_persisted
        expect(block.kind).to eq(kind)
        expect(block.payload).to eq(payload.stringify_keys)
        expect(block.variables).to be_empty
      end
    end

    context "with a participant source variable" do
      let(:other_user) { create(:user, :user) }
      let(:other_participant) do
        create(:experience_participant, user: other_user, experience: experience, role: :audience)
      end
      let(:variables) do
        [
          {
            "key" => "name",
            "label" => "What is your name?",
            "datatype" => "string",
            "required" => true,
            "source" => {
              "type" => "participant",
              "participant_id" => other_participant.id
            }
          }
        ]
      end

      it "creates a variable bound to a question block for that participant" do
        parent_block = subject

        variable = parent_block.variables.find_by(key: "name")
        expect(variable).to be_present
        expect(variable.label).to eq("What is your name?")
        expect(variable.datatype).to eq("string")
        expect(variable.required).to be true

        source_block = variable.bindings.first&.source_block
        expect(source_block).to be_present
        expect(source_block.kind).to eq("question")
        expect(source_block.target_user_ids).to contain_exactly(other_user.id)
        expect(source_block.payload["question"]).to eq("What is your name?")
      end
    end

    context "with a block source variable" do
      let(:variables) do
        [
          {
            "key" => "answer",
            "label" => "Your answer",
            "datatype" => "string",
            "required" => true,
            "source" => {
              "kind" => "poll",
              "payload" => { "question" => "Choose one" },
              "target_user_ids" => [user.id]
            }
          }
        ]
      end

      it "creates a variable bound to the specified block type" do
        parent_block = subject

        variable = parent_block.variables.find_by(key: "answer")
        expect(variable).to be_present

        source_block = variable.bindings.first&.source_block
        expect(source_block).to be_present
        expect(source_block.kind).to eq("poll")
        expect(source_block.payload).to eq({ "question" => "Choose one" })
        expect(source_block.target_user_ids).to contain_exactly(user.id)
      end
    end

    context "with multiple variables" do
      let(:variables) do
        [
          {
            "key" => "var1",
            "label" => "Variable 1",
            "datatype" => "string",
            "required" => true,
            "source" => {
              "kind" => "poll",
              "payload" => {}
            }
          },
          {
            "key" => "var2",
            "label" => "Variable 2",
            "datatype" => "number",
            "required" => false,
            "source" => {
              "kind" => "question",
              "payload" => {}
            }
          }
        ]
      end

      it "creates all variables with their corresponding source blocks" do
        parent_block = subject

        expect(parent_block.variables.count).to eq(2)
        expect(parent_block.child_blocks.count).to eq(2)

        var1 = parent_block.variables.find_by(key: "var1")
        expect(var1.bindings.first.source_block.kind).to eq("poll")

        var2 = parent_block.variables.find_by(key: "var2")
        expect(var2.bindings.first.source_block.kind).to eq("question")
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
        block_id: block.id,
        answer: answer
      )
    end

    context "when the user is a participant and block has no visibility restrictions" do
      it "returns a persisted submission with the user's answer" do
        submission = subject
        expect(submission).to be_persisted
        expect(submission).to be_a(submission_class)
        expect(submission.answer).to eq(answer)
        expect(submission.user).to eq(user)
        expect(submission.experience_block).to eq(block)
      end
    end

    context "when updating an existing submission" do
      let(:old_answer) { { "name" => "old_name" } }

      before do
        create(
          submission_factory,
          experience_block: block,
          user: user,
          answer: old_answer
        )
      end

      it "updates the existing submission with the new answer" do
        submission = subject
        expect(submission.answer).to eq(answer)
        expect(submission_class.where(user: user, experience_block: block).count).to eq(1)
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
  end

  describe "#submit_mad_lib_response!" do
    let(:answer) { { "name" => "John", "place" => "Park" } }

    it_behaves_like "a submission method",
      :submit_mad_lib_response!,
      "mad_lib",
      ExperienceMadLibSubmission,
      :experience_mad_lib_submission
  end

  describe "#submit_question_response!" do
    let(:answer) { "answer text" }

    it_behaves_like "a submission method",
      :submit_question_response!,
      "question",
      ExperienceQuestionSubmission,
      :experience_question_submission
  end

  describe "#submit_multistep_form_response!" do
    let(:answer) { { "step1" => "data", "step2" => "more data" } }

    it_behaves_like "a submission method",
      :submit_multistep_form_response!,
      "multistep_form",
      ExperienceMultistepFormSubmission,
      :experience_multistep_form_submission
  end

  describe "#update_block!" do
    let(:participant_role) { ExperienceParticipant.roles[:host] }

    subject do
      described_class.new(actor: user, experience: experience).update_block!(
        block_id: block.id,
        payload: new_payload,
        visible_to_segment_ids: [],
        variables: variables,
        questions: questions
      )
    end

    let(:variables) { nil }
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
          block_id: block.id,
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

      before { create(:experience_poll_submission, experience_block: block, user: user) }

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

      before { create(:experience_poll_submission, experience_block: block, user: user) }

      it "updates the question text" do
        subject
        block.reload
        expect(block.payload["question"]).to eql("New Q?")
      end
    end

    context "multistep form formKeys changed with submissions" do
      let(:block) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::MULTISTEP_FORM,
          payload: { "questions" => [{ "question" => "Q1", "formKey" => "key1", "inputType" => "text" }] }
        )
      end
      let(:new_payload) do
        { "questions" => [{ "question" => "Q1", "formKey" => "key_changed", "inputType" => "text" }] }
      end

      before { create(:experience_multistep_form_submission, experience_block: block, user: user) }

      it "clears submissions and saves" do
        expect { subject }.to change { ExperienceMultistepFormSubmission.count }.by(-1)
      end
    end

    context "mad lib with submissions while active" do
      let(:block) { create(:experience_block, :mad_lib, experience: experience, status: :open) }
      let(:new_payload) { { "parts" => [{ "id" => "1", "type" => "text", "content" => "hi" }] } }

      before { create(:experience_mad_lib_submission, experience_block: block, user: user) }

      it "raises UnsafeEditError" do
        expect { subject }.to raise_error(Experiences::UnsafeEditError, /Cannot edit a Mad Lib while it is active/)
      end
    end

    context "mad lib with submissions while inactive" do
      let(:block) { create(:experience_block, :mad_lib, experience: experience, status: :hidden) }
      let(:new_payload) { { "parts" => [{ "id" => "1", "type" => "text", "content" => "hi" }] } }

      before { create(:experience_mad_lib_submission, experience_block: block, user: user) }

      it "clears mad lib and child question submissions and saves" do
        expect { subject }.to change { ExperienceMadLibSubmission.count }.by(-1)
      end
    end

    context "family feud with child submissions" do
      let(:block) { create(:experience_block, :family_feud, experience: experience) }
      let(:new_payload) { { "title" => "Updated" } }

      before do
        child = block.child_blocks.first
        create(:experience_question_submission, experience_block: child, user: user)
      end

      it "allows the edit" do
        expect { subject }.not_to raise_error
        expect(block.reload.payload["title"]).to eql("Updated")
      end
    end

    context "re-syncing mad lib variables when no submissions" do
      let(:block) { create(:experience_block, :mad_lib, experience: experience) }
      let(:new_payload) { { "parts" => [] } }
      let(:variables) do
        [{ key: "newvar", label: "New Label", datatype: "string", required: true }]
      end

      before do
        block.variables.create!(key: "oldvar", label: "Old Label", datatype: "string", required: true)
      end

      it "destroys old variables and creates new ones" do
        subject
        block.reload
        expect(block.variables.pluck(:key)).to contain_exactly("newvar")
        expect(block.variables.first.label).to eql("New Label")
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
