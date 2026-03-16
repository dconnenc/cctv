require "rails_helper"

RSpec.describe ExperienceSerializer do
  let(:experience) { create(:experience, status: :live) }

  describe ".serialize_experience" do
    context "with a visibility payload" do
      let(:block) { create(:experience_block, experience: experience) }
      let(:visibility_payload) do
        {
          experience: {
            id: experience.id,
            blocks: [{ id: block.id, kind: block.kind }],
            next_block: nil
          }
        }
      end

      it "includes blocks from the visibility payload" do
        result = described_class.serialize_experience(
          experience, visibility_payload: visibility_payload
        )

        expect(result[:blocks].first[:id]).to eq(block.id)
      end

      context "when the payload includes participant_block_active" do
        before { visibility_payload[:experience][:participant_block_active] = true }

        it "includes participant_block_active in the result" do
          result = described_class.serialize_experience(
            experience, visibility_payload: visibility_payload
          )

          expect(result[:participant_block_active]).to be true
        end
      end

      context "when the payload does not include participant_block_active" do
        it "omits participant_block_active from the result" do
          result = described_class.serialize_experience(
            experience, visibility_payload: visibility_payload
          )

          expect(result).not_to have_key(:participant_block_active)
        end
      end
    end
  end

  def block_ids(result)
    result.dig(:experience, :blocks).map { |b| b[:id] }
  end

  describe ".for_admin" do
    let!(:block1) { create(:experience_block, experience: experience, status: :open, position: 0) }
    let!(:block2) { create(:experience_block, experience: experience, status: :closed, position: 1) }
    let!(:block3) { create(:experience_block, experience: experience, status: :hidden, position: 2) }

    subject(:result) { described_class.for_admin(experience: experience) }

    it "includes all parent blocks regardless of status" do
      expect(block_ids(result)).to contain_exactly(block1.id, block2.id, block3.id)
    end

    it "excludes child blocks" do
      child = create(:experience_block, experience: experience, parent_block: block1, status: :open)
      expect(block_ids(result)).not_to include(child.id)
    end

    it "sets next_block to the second block" do
      expect(result.dig(:experience, :next_block, :id)).to eq(block2.id)
    end
  end

  describe ".for_monitor" do
    context "with public open blocks" do
      let!(:open_block) { create(:experience_block, experience: experience, status: :open, position: 0) }
      let!(:second_block) { create(:experience_block, experience: experience, status: :open, position: 1) }
      let!(:targeted_block) { create(:experience_block, experience: experience, status: :open, position: 2, visible_to_roles: ["player"]) }

      subject(:result) { described_class.for_monitor(experience: experience) }

      it "includes only the first public open block" do
        expect(block_ids(result)).to contain_exactly(open_block.id)
      end

      it "sets next_block to the second public open block" do
        expect(result.dig(:experience, :next_block, :id)).to eq(second_block.id)
      end

      it "includes participant_block_active and responded_participant_ids" do
        expect(result[:experience]).to have_key(:participant_block_active)
        expect(result[:experience]).to have_key(:responded_participant_ids)
      end
    end

    context "when a block has show_on_monitor: false" do
      let!(:hidden_from_monitor) do
        create(:experience_block, experience: experience, status: :open, position: 0,
               payload: { "show_on_monitor" => false })
      end
      let!(:visible_block) { create(:experience_block, experience: experience, status: :open, position: 1) }

      it "excludes it from blocks" do
        result = described_class.for_monitor(experience: experience)
        expect(block_ids(result)).to contain_exactly(visible_block.id)
      end

      it "sets participant_block_active to true" do
        result = described_class.for_monitor(experience: experience)
        expect(result.dig(:experience, :participant_block_active)).to be true
      end
    end

    context "when no block is hidden from monitor" do
      let!(:visible_block) { create(:experience_block, experience: experience, status: :open, position: 0) }

      it "sets participant_block_active to false" do
        result = described_class.for_monitor(experience: experience)
        expect(result.dig(:experience, :participant_block_active)).to be false
      end
    end

    context "in lobby" do
      let(:experience) { create(:experience, status: :lobby) }
      let!(:lobby_block) { create(:experience_block, experience: experience, status: :hidden, show_in_lobby: true, position: 0) }
      let!(:non_lobby_block) { create(:experience_block, experience: experience, status: :hidden, show_in_lobby: false, position: 1) }

      it "includes show_in_lobby blocks" do
        result = described_class.for_monitor(experience: experience)
        expect(block_ids(result)).to contain_exactly(lobby_block.id)
      end
    end
  end

  describe ".for_participant" do
    let(:user) { create(:user, :user) }

    context "when user is not a participant" do
      it "returns empty blocks" do
        result = described_class.for_participant(experience: experience, user: user)
        expect(result.dig(:experience, :blocks)).to be_empty
      end
    end

    context "when user is a regular participant" do
      let!(:participant) { create(:experience_participant, user: user, experience: experience, role: :player) }
      let!(:open_block) { create(:experience_block, experience: experience, status: :open, position: 0) }
      let!(:second_block) { create(:experience_block, experience: experience, status: :open, position: 1) }
      let!(:closed_block) { create(:experience_block, experience: experience, status: :closed, position: 2) }

      subject(:result) { described_class.for_participant(experience: experience, user: user) }

      it "includes only the current resolved block" do
        expect(block_ids(result)).to contain_exactly(open_block.id)
      end

      it "includes next_block" do
        expect(result.dig(:experience, :next_block, :id)).to eq(second_block.id)
      end

      it "does not include closed blocks" do
        expect(block_ids(result)).not_to include(closed_block.id)
      end
    end

    context "when user is a host" do
      let!(:participant) { create(:experience_participant, user: user, experience: experience, role: :host) }
      let!(:open_block) { create(:experience_block, experience: experience, status: :open, position: 0) }
      let!(:closed_block) { create(:experience_block, experience: experience, status: :closed, position: 1) }

      subject(:result) { described_class.for_participant(experience: experience, user: user, participant: participant) }

      it "includes all blocks including closed" do
        expect(block_ids(result)).to include(open_block.id, closed_block.id)
      end
    end

    context "when user is a system admin without a participant record" do
      let(:admin_user) { create(:user, :admin) }
      let!(:open_block) { create(:experience_block, experience: experience, status: :open) }
      let!(:closed_block) { create(:experience_block, experience: experience, status: :closed) }

      subject(:result) { described_class.for_participant(experience: experience, user: admin_user) }

      it "includes all blocks" do
        expect(block_ids(result)).to include(open_block.id, closed_block.id)
      end
    end

    context "segment visibility" do
      let!(:participant) { create(:experience_participant, user: user, experience: experience, role: :player, segments: ["team_a"]) }
      let!(:team_a_block) { create(:experience_block, experience: experience, status: :open, position: 0, visible_to_segment_names: ["team_a"]) }
      let!(:team_b_block) { create(:experience_block, experience: experience, status: :open, position: 1, visible_to_segment_names: ["team_b"]) }

      it "shows only the block matching the participant's segment" do
        result = described_class.for_participant(experience: experience, user: user)
        expect(block_ids(result)).to include(team_a_block.id)
        expect(block_ids(result)).not_to include(team_b_block.id)
      end
    end
  end
end
