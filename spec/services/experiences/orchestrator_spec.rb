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
end
