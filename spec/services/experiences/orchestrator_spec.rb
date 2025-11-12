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

  describe "#open_lobby!" do
    subject do
      described_class.new(actor: user, experience: experience).open_lobby!
    end

    context "when the actor is authorized to perform the action" do
      let(:participant_role) { ExperienceParticipant.roles[:host] }

      before { subject }

      it "sets the experience status to `lobby`" do
        expect(experience.status).to eql(Experience.statuses[:lobby])
      end
    end

    context "when the actor is not authorized to perform the action" do
      let(:participant_role) { ExperienceParticipant.roles[:player] }

      it "raises a forbidden error" do
        expect { subject }.to raise_error(Experiences::ForbiddenError)
      end
    end
  end

  describe "#start!" do
    subject do
      described_class.new(actor: user, experience: experience).start!
    end

    context "when the actor is authorized to perform the action" do
      let(:participant_role) { ExperienceParticipant.roles[:host] }

      before { subject }

      it "sets the experience status to `live`" do
        expect(experience.status).to eql(Experience.statuses[:live])
      end

      it "set the started_at time" do
        expect(experience.started_at).to be_present
      end
    end

    context "when the actor is not authorized to perform the action" do
      let(:participant_role) { ExperienceParticipant.roles[:player] }

      it "raises a forbidden error" do
        expect { subject }.to raise_error(Experiences::ForbiddenError)
      end
    end
  end

  describe "#pause!" do
    subject do
      described_class.new(actor: user, experience: experience).pause!
    end

    context "when the actor is authorized to perform the action" do
      let(:participant_role) { ExperienceParticipant.roles[:host] }

      context "and the experience can be paused" do
        let(:experience_status) { Experience.statuses[:live] }

        before { subject }

        it "sets the experience status to `paused`" do
          expect(experience.status).to eql(Experience.statuses[:paused])
        end
      end

      context "and the experience cannot be paused" do
        let(:experience_status) { Experience.statuses[:finished] }

        it "raises an invalid transistion error" do
          expect { subject }.to raise_error(Experiences::InvalidTransitionError)
        end
      end
    end

    context "when the actor is not authorized to perform the action" do
      let(:participant_role) { ExperienceParticipant.roles[:player] }

      it "raises a forbidden error" do
        expect { subject }.to raise_error(Experiences::ForbiddenError)
      end
    end
  end

  describe "#resume!" do
    subject do
      described_class.new(actor: user, experience: experience).resume!
    end

    context "when the actor is authorized to perform the action" do
      let(:participant_role) { ExperienceParticipant.roles[:host] }

      context "and the experience can be resumed" do
        let(:experience_status) { Experience.statuses[:paused] }

        before { subject }

        it "sets the experience status to `live`" do
          expect(experience.status).to eql(Experience.statuses[:live])
        end
      end

      context "and the experience cannot be resumed" do
        let(:experience_status) { Experience.statuses[:live] }

        it "raises an invalid transistion error" do
          expect { subject }.to raise_error(Experiences::InvalidTransitionError)
        end
      end
    end

    context "when the actor is not authorized to perform the action" do
      let(:participant_role) { ExperienceParticipant.roles[:player] }

      it "raises a forbidden error" do
        expect { subject }.to raise_error(Experiences::ForbiddenError)
      end
    end
  end

  describe "#submit_poll_response!" do
    let(:experience_status) { Experience.statuses[:live] }
    let(:block_status) { "open" }
    let(:answer) { "option_a" }

    let(:block) do
      create(
        :experience_block,
        experience: experience,
        kind: "poll",
        status: block_status
      )
    end

    subject do
      described_class.new(actor: user, experience: experience).submit_poll_response!(
        block_id: block.id,
        answer: answer
      )
    end

    context "when the user is a participant and block has no visibility restrictions" do
      let(:participant_role) { ExperienceParticipant.roles[:audience] }

      it "creates a poll submission" do
        expect { subject }.to change { ExperiencePollSubmission.count }.by(1)
      end

      it "returns the submission" do
        submission = subject
        expect(submission).to be_a(ExperiencePollSubmission)
        expect(submission.answer).to eq(answer)
        expect(submission.user).to eq(user)
        expect(submission.experience_block).to eq(block)
      end
    end

    context "when the user is not a participant" do
      let(:non_participant_user) { create(:user, :user) }

      subject do
        described_class.new(actor: non_participant_user, experience: experience).submit_poll_response!(
          block_id: block.id,
          answer: answer
        )
      end

      it "raises a forbidden error" do
        expect { subject }.to raise_error(Experiences::ForbiddenError)
      end
    end

    context "when the block is not open" do
      let(:block_status) { "closed" }
      let(:participant_role) { ExperienceParticipant.roles[:audience] }

      it "raises a forbidden error" do
        expect { subject }.to raise_error(Experiences::ForbiddenError)
      end
    end

    context "when the block has role-based visibility restrictions" do
      let(:block) do
        create(
          :experience_block,
          experience: experience,
          kind: "poll",
          status: "open",
          visible_to_roles: ["host", "moderator"]
        )
      end

      context "and user has an allowed role" do
        let(:participant_role) { ExperienceParticipant.roles[:host] }

        it "allows submission" do
          expect { subject }.to change { ExperiencePollSubmission.count }.by(1)
        end
      end

      context "and user has a restricted role" do
        let(:participant_role) { ExperienceParticipant.roles[:audience] }

        it "raises a forbidden error" do
          expect { subject }.to raise_error(Experiences::ForbiddenError)
        end
      end
    end

    context "when the block has user-specific targeting" do
      let(:other_user) { create(:user, :user) }
      let(:block) do
        create(
          :experience_block,
          experience: experience,
          kind: "poll",
          status: "open",
          target_user_ids: [other_user.id]
        )
      end

      before do
        create(
          :experience_participant,
          user: other_user,
          experience: experience,
          role: :audience
        )
      end

      context "and user is targeted" do
        let(:block) do
          create(
            :experience_block,
            experience: experience,
            kind: "poll",
            status: "open",
            target_user_ids: [user.id]
          )
        end

        it "allows submission" do
          expect { subject }.to change { ExperiencePollSubmission.count }.by(1)
        end
      end

      context "and user is not targeted" do
        it "raises a forbidden error" do
          expect { subject }.to raise_error(Experiences::ForbiddenError)
        end
      end
    end

    context "when updating an existing submission" do
      let(:participant_role) { ExperienceParticipant.roles[:audience] }

      before do
        create(
          :experience_poll_submission,
          experience_block: block,
          user: user,
          answer: "old_answer"
        )
      end

      it "updates the existing submission instead of creating a new one" do
        expect { subject }.not_to change { ExperiencePollSubmission.count }

        expect(subject.answer).to eq(answer)
      end
    end
  end

  describe "#add_block!" do
    let(:kind) { "poll" }
    let(:payload) { { question: "Test question?" } }
    let(:visible_to_roles) { [] }
    let(:visible_to_segments) { [] }
    let(:target_user_ids) { [] }
    let(:status) { :hidden }
    let(:open_immediately) { false }
    let(:show_in_lobby) { false }

    subject do
      described_class.new(actor: user, experience: experience).add_block!(
        kind: kind,
        payload: payload,
        visible_to_roles: visible_to_roles,
        visible_to_segments: visible_to_segments,
        target_user_ids: target_user_ids,
        status: status,
        open_immediately: open_immediately,
        show_in_lobby: show_in_lobby
      )
    end

    context "when the actor is authorized to perform the action" do
      let(:participant_role) { ExperienceParticipant.roles[:host] }

      it "creates a new experience block" do
        expect { subject }.to change { ExperienceBlock.count }.by(1)
      end

      it "returns the created block" do
        block = subject
        expect(block).to be_a(ExperienceBlock)
        expect(block.kind).to eq(kind)
        expect(block.payload).to eq(payload)
        expect(block.status).to eq(status.to_s)
      end

      it "sets the position to the next available position" do
        create(:experience_block, experience: experience, position: 5)
        block = subject
        expect(block.position).to eq(6)
      end

      context "when open_immediately is true" do
        let(:open_immediately) { true }

        it "sets the block status to open" do
          block = subject
          expect(block.status).to eq("open")
        end
      end

      context "when open_immediately is false" do
        let(:open_immediately) { false }

        it "keeps the block status as provided" do
          block = subject
          expect(block.status).to eq(status.to_s)
        end
      end

      context "when visible_to_roles is specified" do
        let(:visible_to_roles) { ["host", "moderator"] }

        it "sets the visible_to_roles on the block" do
          block = subject
          expect(block.visible_to_roles).to eq(visible_to_roles)
        end
      end

      context "when target_user_ids is specified" do
        let(:target_user_ids) { [user.id] }

        it "sets the target_user_ids on the block" do
          block = subject
          expect(block.target_user_ids).to eq(target_user_ids)
        end
      end
    end

    context "when the actor is not authorized to perform the action" do
      let(:participant_role) { ExperienceParticipant.roles[:audience] }

      it "raises a forbidden error" do
        expect { subject }.to raise_error(Experiences::ForbiddenError)
      end
    end
  end

  describe "#add_block_with_dependencies!" do
    let(:kind) { "mad_lib" }
    let(:payload) { { template: "Hello {name}!" } }
    let(:visible_to_roles) { [] }
    let(:visible_to_segments) { [] }
    let(:target_user_ids) { [] }
    let(:status) { :hidden }
    let(:variables) { [] }

    subject do
      described_class.new(actor: user, experience: experience).add_block_with_dependencies!(
        kind: kind,
        payload: payload,
        visible_to_roles: visible_to_roles,
        visible_to_segments: visible_to_segments,
        target_user_ids: target_user_ids,
        status: status,
        variables: variables
      )
    end

    context "when the actor is authorized to perform the action" do
      let(:participant_role) { ExperienceParticipant.roles[:host] }

      context "and there are no variables" do
        let(:variables) { [] }

        it "creates a parent block" do
          expect { subject }.to change { ExperienceBlock.count }.by(1)
        end

        it "returns the created parent block" do
          block = subject
          expect(block).to be_a(ExperienceBlock)
          expect(block.kind).to eq(kind)
          expect(block.payload).to eq(payload)
        end
      end

      context "and there are variables with participant sources" do
        let(:other_user) { create(:user, :user) }
        let(:variables) do
          [
            {
              "key" => "name",
              "label" => "What is your name?",
              "datatype" => "string",
              "required" => true,
              "source" => {
                "type" => "participant",
                "participant_id" => other_user.id
              }
            }
          ]
        end

        before do
          create(
            :experience_participant,
            user: other_user,
            experience: experience,
            role: :audience
          )
        end

        it "creates a parent block and child block" do
          expect { subject }.to change { ExperienceBlock.count }.by(2)
        end

        it "creates a variable for the parent block" do
          expect { subject }.to change { ExperienceBlockVariable.count }.by(1)
        end

        it "creates a block link between parent and child" do
          expect { subject }.to change { ExperienceBlockLink.count }.by(1)
        end

        it "creates a variable binding" do
          expect { subject }.to change { ExperienceBlockVariableBinding.count }.by(1)
        end

        it "creates a question block targeting the participant" do
          parent_block = subject
          child_block = parent_block.child_blocks.first
          expect(child_block.kind).to eq("question")
          expect(child_block.target_user_ids).to eq([other_user.id])
          expect(child_block.payload["question"]).to eq("What is your name?")
        end
      end

      context "and there are variables with block sources" do
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

        it "creates a parent block and child block" do
          expect { subject }.to change { ExperienceBlock.count }.by(2)
        end

        it "creates a variable for the parent block" do
          expect { subject }.to change { ExperienceBlockVariable.count }.by(1)
        end

        it "creates a block link between parent and child" do
          expect { subject }.to change { ExperienceBlockLink.count }.by(1)
        end

        it "creates a variable binding" do
          expect { subject }.to change { ExperienceBlockVariableBinding.count }.by(1)
        end

        it "creates a child block with the specified properties" do
          parent_block = subject
          child_block = parent_block.child_blocks.first
          expect(child_block.kind).to eq("poll")
          expect(child_block.payload).to eq({ "question" => "Choose one" })
          expect(child_block.target_user_ids).to eq([user.id])
        end
      end

      context "and there are multiple variables" do
        let(:other_user) { create(:user, :user) }
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

        before do
          create(
            :experience_participant,
            user: other_user,
            experience: experience,
            role: :audience
          )
        end

        it "creates a parent block and multiple child blocks" do
          expect { subject }.to change { ExperienceBlock.count }.by(3)
        end

        it "creates variables for each variable spec" do
          expect { subject }.to change { ExperienceBlockVariable.count }.by(2)
        end

        it "creates block links for each child" do
          expect { subject }.to change { ExperienceBlockLink.count }.by(2)
        end

        it "creates variable bindings for each variable" do
          expect { subject }.to change { ExperienceBlockVariableBinding.count }.by(2)
        end
      end
    end

    context "when the actor is not authorized to perform the action" do
      let(:participant_role) { ExperienceParticipant.roles[:audience] }

      it "raises a forbidden error" do
        expect { subject }.to raise_error(Experiences::ForbiddenError)
      end
    end
  end

  describe "#submit_mad_lib_response!" do
    let(:experience_status) { Experience.statuses[:live] }
    let(:block_status) { "open" }
    let(:answer) { { "name" => "John", "place" => "Park" } }

    let(:block) do
      create(
        :experience_block,
        experience: experience,
        kind: "mad_lib",
        status: block_status
      )
    end

    subject do
      described_class.new(actor: user, experience: experience).submit_mad_lib_response!(
        block_id: block.id,
        answer: answer
      )
    end

    context "when the user is a participant and block has no visibility restrictions" do
      let(:participant_role) { ExperienceParticipant.roles[:audience] }

      it "creates a mad lib submission" do
        expect { subject }.to change { ExperienceMadLibSubmission.count }.by(1)
      end

      it "returns the submission" do
        submission = subject
        expect(submission).to be_a(ExperienceMadLibSubmission)
        expect(submission.answer).to eq(answer)
        expect(submission.user).to eq(user)
        expect(submission.experience_block).to eq(block)
      end
    end

    context "when the user is not a participant" do
      let(:non_participant_user) { create(:user, :user) }

      subject do
        described_class.new(actor: non_participant_user, experience: experience).submit_mad_lib_response!(
          block_id: block.id,
          answer: answer
        )
      end

      it "raises a forbidden error" do
        expect { subject }.to raise_error(Experiences::ForbiddenError)
      end
    end

    context "when the block is not open" do
      let(:block_status) { "closed" }
      let(:participant_role) { ExperienceParticipant.roles[:audience] }

      it "raises a forbidden error" do
        expect { subject }.to raise_error(Experiences::ForbiddenError)
      end
    end

    context "when the block has role-based visibility restrictions" do
      let(:block) do
        create(
          :experience_block,
          experience: experience,
          kind: "mad_lib",
          status: "open",
          visible_to_roles: ["host", "moderator"]
        )
      end

      context "and user has an allowed role" do
        let(:participant_role) { ExperienceParticipant.roles[:host] }

        it "allows submission" do
          expect { subject }.to change { ExperienceMadLibSubmission.count }.by(1)
        end
      end

      context "and user has a restricted role" do
        let(:participant_role) { ExperienceParticipant.roles[:audience] }

        it "raises a forbidden error" do
          expect { subject }.to raise_error(Experiences::ForbiddenError)
        end
      end
    end

    context "when the block has user-specific targeting" do
      let(:other_user) { create(:user, :user) }
      let(:block) do
        create(
          :experience_block,
          experience: experience,
          kind: "mad_lib",
          status: "open",
          target_user_ids: [other_user.id]
        )
      end

      before do
        create(
          :experience_participant,
          user: other_user,
          experience: experience,
          role: :audience
        )
      end

      context "and user is targeted" do
        let(:block) do
          create(
            :experience_block,
            experience: experience,
            kind: "mad_lib",
            status: "open",
            target_user_ids: [user.id]
          )
        end

        it "allows submission" do
          expect { subject }.to change { ExperienceMadLibSubmission.count }.by(1)
        end
      end

      context "and user is not targeted" do
        it "raises a forbidden error" do
          expect { subject }.to raise_error(Experiences::ForbiddenError)
        end
      end
    end

    context "when updating an existing submission" do
      let(:participant_role) { ExperienceParticipant.roles[:audience] }

      before do
        create(
          :experience_mad_lib_submission,
          experience_block: block,
          user: user,
          answer: { "name" => "old_name" }
        )
      end

      it "updates the existing submission instead of creating a new one" do
        expect { subject }.not_to change { ExperienceMadLibSubmission.count }

        expect(subject.answer).to eq(answer)
      end
    end
  end
end
