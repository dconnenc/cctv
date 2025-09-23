require "rails_helper"

RSpec.describe ExperienceBlockPolicy do
  subject { described_class.new(block, user: user) }
  
  let(:experience) { create(:experience) }
  let(:user) { create(:user, :user) }
  let(:block) { create(:experience_block, experience: experience, kind: "poll", status: "open") }

  describe "#submit_poll_response?" do
    context "when user is nil" do
      let(:user) { nil }

      it "returns false" do
        expect(subject.submit_poll_response?).to be false
      end
    end

    context "when user is not a participant" do
      let(:non_participant_user) { create(:user, :user) }
      subject { described_class.new(block, user: non_participant_user) }

      it "returns false" do
        expect(subject.submit_poll_response?).to be false
      end
    end

    context "when user is a participant" do
      before do
        create(:experience_participant, user: user, experience: experience, role: :audience)
      end

      context "and block is not open" do
        let(:block) { create(:experience_block, experience: experience, kind: "poll", status: "closed") }

        it "returns false" do
          expect(subject.submit_poll_response?).to be false
        end
      end

      context "and block is open with no visibility restrictions" do
        it "returns true" do
          expect(subject.submit_poll_response?).to be true
        end
      end

      context "and block has empty visibility restrictions" do
        let(:block) do
          create(:experience_block, 
                 experience: experience, 
                 kind: "poll", 
                 status: "open",
                 visible_to_roles: [],
                 visible_to_segments: [],
                 target_user_ids: [])
        end

        it "returns true" do
          expect(subject.submit_poll_response?).to be true
        end
      end

      context "and block has role-based visibility restrictions" do
        let(:block) do
          create(:experience_block, 
                 experience: experience, 
                 kind: "poll", 
                 status: "open",
                 visible_to_roles: ["host", "moderator"])
        end

        context "when user has an allowed role" do
          before do
            experience.experience_participants.find_by(user: user).update!(role: :host)
          end

          it "returns true" do
            expect(subject.submit_poll_response?).to be true
          end
        end

        context "when user has a restricted role" do
          before do
            experience.experience_participants.find_by(user: user).update!(role: :audience)
          end

          it "returns false" do
            expect(subject.submit_poll_response?).to be false
          end
        end
      end

      context "and block has user-specific targeting" do
        let(:other_user) { create(:user, :user) }
        let(:block) do
          create(:experience_block, 
                 experience: experience, 
                 kind: "poll", 
                 status: "open",
                 target_user_ids: [other_user.id])
        end

        context "when user is in the target list" do
          let(:block) do
            create(:experience_block, 
                   experience: experience, 
                   kind: "poll", 
                   status: "open",
                   target_user_ids: [user.id])
          end

          it "returns true" do
            expect(subject.submit_poll_response?).to be true
          end
        end

        context "when user is not in the target list" do
          it "returns false" do
            expect(subject.submit_poll_response?).to be false
          end
        end
      end

      context "and block has segment-based visibility restrictions" do
        let(:block) do
          create(:experience_block, 
                 experience: experience, 
                 kind: "poll", 
                 status: "open",
                 visible_to_segments: ["segment_a"])
        end

        # Since segments are not implemented yet, this should return false
        it "returns false" do
          expect(subject.submit_poll_response?).to be false
        end
      end

      context "with multiple visibility restrictions" do
        let(:block) do
          create(:experience_block, 
                 experience: experience, 
                 kind: "poll", 
                 status: "open",
                 visible_to_roles: ["host"],
                 target_user_ids: [user.id])
        end

        context "when user matches any restriction (role)" do
          before do
            experience.experience_participants.find_by(user: user).update!(role: :host)
          end

          it "returns true" do
            expect(subject.submit_poll_response?).to be true
          end
        end

        context "when user matches any restriction (targeting)" do
          before do
            experience.experience_participants.find_by(user: user).update!(role: :audience)
          end

          it "returns true" do
            expect(subject.submit_poll_response?).to be true
          end
        end

        context "when user matches no restrictions" do
          let(:other_user) { create(:user, :user) }
          let(:block) do
            create(:experience_block, 
                   experience: experience, 
                   kind: "poll", 
                   status: "open",
                   visible_to_roles: ["host"],
                   target_user_ids: [other_user.id])
          end

          before do
            experience.experience_participants.find_by(user: user).update!(role: :audience)
          end

          it "returns false" do
            expect(subject.submit_poll_response?).to be false
          end
        end
      end
    end
  end


end