require "rails_helper"

RSpec.describe Experiences::Visibility do
  let(:experience) { create(:experience, status: :live) }

  describe ".for_admin" do
    let!(:block1) { create(:experience_block, experience: experience, status: :open, position: 0) }
    let!(:block2) { create(:experience_block, experience: experience, status: :closed, position: 1) }
    let!(:block3) { create(:experience_block, experience: experience, status: :hidden, position: 2) }

    subject(:result) { described_class.for_admin(experience) }

    it "includes all parent blocks regardless of status" do
      ids = result[:blocks].map { |b| b[:id] }
      expect(ids).to contain_exactly(block1.id, block2.id, block3.id)
    end

    it "excludes child blocks" do
      child = create(:experience_block, experience: experience, parent_block: block1, status: :open)
      ids = result[:blocks].map { |b| b[:id] }
      expect(ids).not_to include(child.id)
    end

    it "includes visibility metadata on each block" do
      block = result[:blocks].first
      expect(block).to have_key(:visible_to_roles)
      expect(block).to have_key(:visible_to_segments)
    end

    it "does not include next_block" do
      expect(result).not_to have_key(:next_block)
    end
  end

  describe ".for_monitor" do
    subject(:result) { described_class.for_monitor(experience) }

    context "with public open blocks" do
      let!(:open_block) { create(:experience_block, experience: experience, status: :open, position: 0) }
      let!(:second_block) { create(:experience_block, experience: experience, status: :open, position: 1) }
      let!(:targeted_block) { create(:experience_block, experience: experience, status: :open, position: 2, visible_to_roles: ["player"]) }

      it "includes only the first public open block" do
        ids = result[:blocks].map { |b| b[:id] }
        expect(ids).to contain_exactly(open_block.id)
      end

      it "includes participant_block_active and responded_participant_ids" do
        expect(result).to have_key(:participant_block_active)
        expect(result).to have_key(:responded_participant_ids)
      end

      it "does not include next_block" do
        expect(result).not_to have_key(:next_block)
      end
    end

    context "when a block has show_on_monitor: false" do
      let!(:hidden_from_monitor) do
        create(:experience_block, experience: experience, status: :open, position: 0,
               payload: { "show_on_monitor" => false })
      end
      let!(:visible_block) { create(:experience_block, experience: experience, status: :open, position: 1) }

      it "excludes it from blocks" do
        ids = result[:blocks].map { |b| b[:id] }
        expect(ids).to contain_exactly(visible_block.id)
      end

      it "sets participant_block_active to true" do
        expect(result[:participant_block_active]).to be true
      end
    end

    context "when no block is hidden from monitor" do
      let!(:visible_block) { create(:experience_block, experience: experience, status: :open) }

      it "sets participant_block_active to false" do
        expect(result[:participant_block_active]).to be false
      end
    end

    context "in lobby" do
      let(:experience) { create(:experience, status: :lobby) }
      let!(:lobby_block) { create(:experience_block, experience: experience, status: :hidden, show_in_lobby: true, position: 0) }
      let!(:non_lobby_block) { create(:experience_block, experience: experience, status: :hidden, show_in_lobby: false, position: 1) }

      it "includes show_in_lobby blocks only" do
        ids = result[:blocks].map { |b| b[:id] }
        expect(ids).to contain_exactly(lobby_block.id)
      end
    end

    context "with dependency blocks" do
      let!(:parent) { create(:experience_block, experience: experience, status: :open, position: 0) }
      let!(:child) { create(:experience_block, experience: experience, parent_block: parent, status: :open, position: 0) }

      before { create(:experience_block_link, parent_block: parent, child_block: child) }

      it "yields the first child when it has no visibility rules" do
        ids = result[:blocks].map { |b| b[:id] }
        expect(ids).to include(child.id)
        expect(ids).not_to include(parent.id)
      end

      context "when the first child has visibility rules" do
        before { child.update!(visible_to_roles: ["player"]) }

        it "yields the parent instead" do
          ids = result[:blocks].map { |b| b[:id] }
          expect(ids).to include(parent.id)
          expect(ids).not_to include(child.id)
        end
      end

      context "for FAMILY_FEUD kind" do
        before { parent.update!(kind: ExperienceBlock::FAMILY_FEUD) }

        it "always yields the parent" do
          ids = result[:blocks].map { |b| b[:id] }
          expect(ids).to include(parent.id)
          expect(ids).not_to include(child.id)
        end
      end
    end
  end

  describe ".for_participant" do
    let(:user) { create(:user, :user) }

    context "when participant is a player" do
      let!(:participant) { create(:experience_participant, user: user, experience: experience, role: :player) }
      let!(:open_block) { create(:experience_block, experience: experience, status: :open, position: 0) }
      let!(:second_block) { create(:experience_block, experience: experience, status: :open, position: 1) }
      let!(:closed_block) { create(:experience_block, experience: experience, status: :closed, position: 2) }

      subject(:result) { described_class.for_participant(experience, participant) }

      it "includes only the current resolved block" do
        ids = result[:blocks].map { |b| b[:id] }
        expect(ids).to contain_exactly(open_block.id)
      end

      it "does not include closed blocks" do
        ids = result[:blocks].map { |b| b[:id] }
        expect(ids).not_to include(closed_block.id)
      end

      it "does not include next_block" do
        expect(result).not_to have_key(:next_block)
      end
    end

    context "when participant is a host" do
      let!(:participant) { create(:experience_participant, user: user, experience: experience, role: :host) }
      let!(:open_block) { create(:experience_block, experience: experience, status: :open, position: 0) }
      let!(:closed_block) { create(:experience_block, experience: experience, status: :closed, position: 1) }

      subject(:result) { described_class.for_participant(experience, participant) }

      it "includes all blocks including closed" do
        ids = result[:blocks].map { |b| b[:id] }
        expect(ids).to include(open_block.id, closed_block.id)
      end

      it "includes visibility metadata" do
        block = result[:blocks].first
        expect(block).to have_key(:visible_to_roles)
      end
    end

    context "when participant is a moderator" do
      let!(:participant) { create(:experience_participant, user: user, experience: experience, role: :moderator) }
      let!(:open_block) { create(:experience_block, experience: experience, status: :open) }
      let!(:closed_block) { create(:experience_block, experience: experience, status: :closed) }

      it "includes all blocks" do
        result = described_class.for_participant(experience, participant)
        ids = result[:blocks].map { |b| b[:id] }
        expect(ids).to include(open_block.id, closed_block.id)
      end
    end

    context "segment visibility" do
      let!(:participant) { create(:experience_participant, user: user, experience: experience, role: :player, segments: ["team_a"]) }
      let!(:team_a_block) { create(:experience_block, experience: experience, status: :open, position: 0, visible_to_segment_names: ["team_a"]) }
      let!(:team_b_block) { create(:experience_block, experience: experience, status: :open, position: 1, visible_to_segment_names: ["team_b"]) }

      it "shows only the block matching the participant's segment" do
        result = described_class.for_participant(experience, participant)
        ids = result[:blocks].map { |b| b[:id] }
        expect(ids).to include(team_a_block.id)
        expect(ids).not_to include(team_b_block.id)
      end
    end

    context "when no blocks are open" do
      let!(:participant) { create(:experience_participant, user: user, experience: experience, role: :player) }

      it "returns empty blocks" do
        result = described_class.for_participant(experience, participant)
        expect(result[:blocks]).to be_empty
      end
    end
  end

  describe ".block_visible_to_user?" do
    let(:user) { create(:user, :user) }
    let!(:participant) { create(:experience_participant, user: user, experience: experience, role: :audience) }
    let!(:open_block) { create(:experience_block, experience: experience, status: :open) }
    let!(:closed_block) { create(:experience_block, experience: experience, status: :closed) }

    it "returns true for an open block the participant can see" do
      expect(described_class.block_visible_to_user?(block: open_block, user: user)).to be true
    end

    it "returns false for a closed block" do
      expect(described_class.block_visible_to_user?(block: closed_block, user: user)).to be false
    end

    it "returns false when user is not a participant" do
      non_participant = create(:user, :user)
      expect(described_class.block_visible_to_user?(block: open_block, user: non_participant)).to be false
    end

    context "when user is admin" do
      let(:admin_user) { create(:user, :admin) }

      it "returns true for any block regardless of status" do
        expect(described_class.block_visible_to_user?(block: open_block, user: admin_user)).to be true
        expect(described_class.block_visible_to_user?(block: closed_block, user: admin_user)).to be true
      end
    end
  end
end
