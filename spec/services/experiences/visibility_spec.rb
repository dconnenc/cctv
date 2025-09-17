require "rails_helper"

RSpec.describe Experiences::Visibility do
  subject { described_class.new(user: user, experience: experience).payload }

  let(:experience) { create(:experience, status: experience_status) }
  let(:user) { create(:user, :user) }
  let(:participant_role) { ExperienceParticipant.roles[:audience] }
  let(:experience_status) { Experience.statuses[:draft] }

  let(:user_segment) { "user segment" }
  let(:other_segment) { "other segment" }

  before do
    create(
      :experience_participant,
      user: user,
      experience: experience,
      role: participant_role,
      segments: [user_segment]
    )
  end

  describe "#payload" do
    describe "segment visibility" do
      context "when a blocks exists that has no targetting rules" do
        let!(:global_block) do
          create(
            :experience_block,
            experience: experience,
            visible_to_segments: [],
            visible_to_roles: [],
            target_user_ids: []
          )
        end

        it "returns a payload that includes only the matching block" do
          expect(subject[:experience][:blocks]).to eql([{
            id: global_block.id,
            kind: global_block.kind,
            status: global_block.status,
            payload: global_block.payload
          }])
        end
      end

      context "when a blocks exists that matches the participants's segment" do
        let!(:matching_experience_block) do
          create(
            :experience_block,
            experience: experience,
            visible_to_segments: [user_segment]
          )
        end

        let!(:non_matching_experience_block) do
          create(
            :experience_block,
            experience: experience,
            visible_to_segments: [other_segment]
          )
        end

        it "returns a payload that includes only the matching block" do
          expect(subject[:experience][:blocks]).to eql([{
            id: matching_experience_block.id,
            kind: matching_experience_block.kind,
            status: matching_experience_block.status,
            payload: matching_experience_block.payload
          }])
        end
      end
    end

    describe "role visibility" do
      let(:participant_role) { ExperienceParticipant.roles[:player] }

      context "when a block exists matches the user's role" do
        let!(:matching_experience_block) do
          create(
            :experience_block,
            experience: experience,
            visible_to_roles: ["player"]
          )
        end

        let!(:non_matching_experience_block) do
          create(
            :experience_block,
            experience: experience,
            visible_to_roles: ["audience"]
          )
        end

        it "returns a payload that includes only the matching block" do
          expect(subject[:experience][:blocks]).to eql([{
            id: matching_experience_block.id,
            kind: matching_experience_block.kind,
            status: matching_experience_block.status,
            payload: matching_experience_block.payload
          }])
        end
      end
    end

    describe "user targeting visibility" do
      context "when a block exists that targets the user" do
        let!(:targeted_experience_block) do
          create(
            :experience_block,
            experience: experience,
            target_user_ids: [user.id]
          )
        end

        let!(:non_targeted_experience_block) do
          create(
            :experience_block,
            experience: experience,
            target_user_ids: [create(:user).id]
          )
        end

        it "returns a payload that includes only the targeted block" do
          blocks = subject[:experience][:blocks]

          expect(subject[:experience][:blocks]).to eql([{
            id: targeted_experience_block.id,
            kind: targeted_experience_block.kind,
            status: targeted_experience_block.status,
            payload: targeted_experience_block.payload
          }])
        end
      end
    end

    describe "moderator and host visibility" do
      context "when user is a moderator" do
        let(:participant_role) { ExperienceParticipant.roles[:moderator] }

        let!(:closed_block) do
          create(
            :experience_block,
            experience: experience,
            status: :closed
          )
        end

        let!(:open_block) do
          create(
            :experience_block,
            experience: experience,
            status: :open
          )
        end

        it "returns blocks with visibility metadata" do
          blocks = subject[:experience][:blocks]

          closed_block_payload = blocks.find { |b| b[:id] == closed_block.id }

          expect(closed_block_payload).to include({
            id: closed_block.id,
            kind: closed_block.kind,
            status: closed_block.status,
            payload: closed_block.payload,
            visible_to_roles: closed_block.visible_to_roles,
            visible_to_segments: closed_block.visible_to_segments
          })
        end

        it "can see both open and closed blocks" do
          block_ids = subject[:experience][:blocks].map { |b| b[:id] }
          expect(block_ids).to include(closed_block.id, open_block.id)
        end
      end

      context "when user is a host" do
        let(:participant_role) { ExperienceParticipant.roles[:host] }

        let!(:closed_block) do
          create(
            :experience_block,
            experience: experience,
            status: :closed
          )
        end

        it "returns blocks with visibility metadata" do
          blocks = subject[:experience][:blocks]

          closed_block_payload = blocks.find { |b| b[:id] == closed_block.id }
          expect(closed_block_payload).to include({
            id: closed_block.id,
            kind: closed_block.kind,
            status: closed_block.status,
            payload: closed_block.payload,
            visible_to_roles: closed_block.visible_to_roles,
            visible_to_segments: closed_block.visible_to_segments
          })
        end

        it "can see closed blocks" do
          block_ids = subject[:experience][:blocks].map { |b| b[:id] }
          expect(block_ids).to include(closed_block.id)
        end
      end

      context "when user is audience" do
        let(:participant_role) { ExperienceParticipant.roles[:audience] }

        let!(:closed_block) do
          create(
            :experience_block,
            experience: experience,
            status: :closed
          )
        end

        let!(:open_block) do
          create(
            :experience_block,
            experience: experience,
            status: :open
          )
        end

        it "returns blocks without visibility metadata" do
          blocks = subject[:experience][:blocks]

          open_block_payload = blocks.find { |b| b[:id] == open_block.id }
          expect(open_block_payload).to eq({
            id: open_block.id,
            kind: open_block.kind,
            status: open_block.status,
            payload: open_block.payload
          })
        end

        it "cannot see closed blocks" do
          block_ids = subject[:experience][:blocks].map { |b| b[:id] }
          expect(block_ids).not_to include(closed_block.id)
          expect(block_ids).to include(open_block.id)
        end
      end
    end
  end
end
