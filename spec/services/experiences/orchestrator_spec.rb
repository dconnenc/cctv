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

    context "when the actor is not authorized to perform the action" do
      let(:participant_role) { ExperienceParticipant.roles[:audience] }

      it "raises a forbidden error" do
        expect { subject }.to raise_error(Experiences::ForbiddenError)
      end
    end
  end

  shared_examples "a submission method" do |method_name, block_kind, submission_class, submission_factory|
    let(:experience_status) { Experience.statuses[:live] }
    let(:block_status) { "open" }

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
      let(:participant_role) { ExperienceParticipant.roles[:audience] }

      it "returns a persisted submission with the user's answer" do
        submission = subject
        expect(submission).to be_persisted
        expect(submission).to be_a(submission_class)
        expect(submission.answer).to eq(answer)
        expect(submission.user).to eq(user)
        expect(submission.experience_block).to eq(block)
      end
    end

    context "when the user is not a participant" do
      let(:non_participant_user) { create(:user, :user) }

      subject do
        described_class.new(actor: non_participant_user, experience: experience).public_send(
          method_name,
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
          kind: block_kind,
          status: "open",
          visible_to_roles: ["host", "moderator"]
        )
      end

      context "and user has an allowed role" do
        let(:participant_role) { ExperienceParticipant.roles[:host] }

        it "allows submission" do
          submission = subject
          expect(submission).to be_persisted
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
          kind: block_kind,
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
            kind: block_kind,
            status: "open",
            target_user_ids: [user.id]
          )
        end

        it "allows submission" do
          submission = subject
          expect(submission).to be_persisted
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
      let(:old_answer) { block_kind == "poll" ? "old_answer" : { "name" => "old_name" } }

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
    let(:answer) { "option_a" }

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
end
