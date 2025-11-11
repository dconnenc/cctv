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
end
