require "rails_helper"

RSpec.describe ExperiencePollSubmission, type: :model do
  let(:experience) { create(:experience) }
  let(:user) { create(:user, :user) }
  let(:block) { create(:experience_block, experience: experience, kind: "poll", status: "open") }

  before do
    create(:experience_participant, user: user, experience: experience, role: :audience)
  end

  describe "validations" do
    subject { build(:experience_poll_submission, user: user, experience_block: block, answer: "option_a") }

    it "is valid with valid attributes" do
      expect(subject).to be_valid
    end

    describe "answer validation" do
      it "requires an answer" do
        subject.answer = nil
        expect(subject).not_to be_valid
        expect(subject.errors[:answer]).to include("can't be blank")
      end

      it "requires answer to be present (not empty string)" do
        subject.answer = ""
        expect(subject).not_to be_valid
        expect(subject.errors[:answer]).to include("can't be blank")
      end
    end

    describe "user_can_submit_to_block validation" do
      context "when user is not a participant" do
        let(:non_participant_user) { create(:user, :user) }
        subject { build(:experience_poll_submission, user: non_participant_user, experience_block: block, answer: "option_a") }

        it "is not valid" do
          expect(subject).not_to be_valid
          expect(subject.errors[:base]).to include("You are not authorized to submit to this poll")
        end
      end

      context "when block is not open" do
        let(:block) { create(:experience_block, experience: experience, kind: "poll", status: "closed") }

        it "is not valid" do
          expect(subject).not_to be_valid
          expect(subject.errors[:base]).to include("You are not authorized to submit to this poll")
        end
      end

      context "when user doesn't have required role" do
        let(:block) do
          create(:experience_block, 
                 experience: experience, 
                 kind: "poll", 
                 status: "open",
                 visible_to_roles: ["host"])
        end

        before do
          experience.experience_participants.find_by(user: user).update!(role: :audience)
        end

        it "is not valid" do
          expect(subject).not_to be_valid
          expect(subject.errors[:base]).to include("You are not authorized to submit to this poll")
        end
      end

      context "when user is not in target list" do
        let(:other_user) { create(:user, :user) }
        let(:block) do
          create(:experience_block, 
                 experience: experience, 
                 kind: "poll", 
                 status: "open",
                 target_user_ids: [other_user.id])
        end

        it "is not valid" do
          expect(subject).not_to be_valid
          expect(subject.errors[:base]).to include("You are not authorized to submit to this poll")
        end
      end
    end

    describe "block_is_poll_type validation" do
      # Since KINDS only includes "poll" currently, we can't easily test this
      # without stubbing or modifying the block directly
      context "when experience_block kind is not poll" do
        before do
          # Bypass model validations to create a non-poll block for testing
          block.update_column(:kind, "invalid_kind")
        end

        it "is not valid" do
          expect(subject).not_to be_valid
          expect(subject.errors[:experience_block]).to include("must be a poll block")
        end
      end
    end
  end

  describe "associations" do
    it "belongs to experience_block" do
      submission = build(:experience_poll_submission, user: user, experience_block: block)
      expect(submission.experience_block).to eq(block)
    end

    it "belongs to user" do
      submission = build(:experience_poll_submission, user: user, experience_block: block)
      expect(submission.user).to eq(user)
    end
  end

  describe "creating submissions" do
    context "when all validations pass" do
      it "creates a successful submission" do
        submission = create(:experience_poll_submission, 
                           user: user, 
                           experience_block: block, 
                           answer: "option_a")
        
        expect(submission).to be_persisted
        expect(submission.answer).to eq("option_a")
        expect(submission.user).to eq(user)
        expect(submission.experience_block).to eq(block)
      end
    end

    context "when user has proper role restrictions" do
      let(:block) do
        create(:experience_block, 
               experience: experience, 
               kind: "poll", 
               status: "open",
               visible_to_roles: ["audience"])
      end

      it "creates a successful submission" do
        submission = create(:experience_poll_submission, 
                           user: user, 
                           experience_block: block, 
                           answer: "option_b")
        
        expect(submission).to be_persisted
      end
    end

    context "when user is specifically targeted" do
      let(:block) do
        create(:experience_block, 
               experience: experience, 
               kind: "poll", 
               status: "open",
               target_user_ids: [user.id])
      end

      it "creates a successful submission" do
        submission = create(:experience_poll_submission, 
                           user: user, 
                           experience_block: block, 
                           answer: "option_c")
        
        expect(submission).to be_persisted
      end
    end
  end
end