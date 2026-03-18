require "rails_helper"

RSpec.describe Experiences::Visibility do
  let(:experience) { create(:experience, status: :live) }

  describe "#visible_blocks" do
    context "when participant_role is nil" do
      let(:visibility) { described_class.new(experience: experience, participant_role: nil) }

      let!(:open_block) { create(:experience_block, experience: experience, status: :open) }

      it "returns no blocks" do
        expect(visibility.visible_blocks).to be_empty
      end
    end

    context "when user is admin" do
      let(:visibility) { described_class.new(experience: experience, user_role: "admin", participant_role: nil) }

      let!(:open_block) { create(:experience_block, experience: experience, status: :open) }
      let!(:closed_block) { create(:experience_block, experience: experience, status: :closed) }
      let!(:hidden_block) { create(:experience_block, experience: experience, status: :hidden) }

      it "returns all parent blocks regardless of status" do
        ids = visibility.visible_blocks.map(&:id)
        expect(ids).to contain_exactly(open_block.id, closed_block.id, hidden_block.id)
      end

      it "excludes child blocks" do
        child = create(:experience_block, experience: experience, parent_block: open_block, status: :open)
        expect(visibility.visible_blocks.map(&:id)).not_to include(child.id)
      end
    end

    context "when participant is host or moderator" do
      let!(:open_block) { create(:experience_block, experience: experience, status: :open) }
      let!(:closed_block) { create(:experience_block, experience: experience, status: :closed) }
      let!(:targeted_block) { create(:experience_block, experience: experience, status: :open, visible_to_roles: ["audience"]) }

      it "returns all parent blocks including closed and targeted" do
        %w[host moderator].each do |role|
          visibility = described_class.new(experience: experience, participant_role: role)
          ids = visibility.visible_blocks.map(&:id)
          expect(ids).to include(open_block.id, closed_block.id, targeted_block.id)
        end
      end
    end

    context "status filtering" do
      let(:visibility) { described_class.new(experience: experience, participant_role: :audience) }

      let!(:open_block) { create(:experience_block, experience: experience, status: :open) }
      let!(:closed_block) { create(:experience_block, experience: experience, status: :closed) }
      let!(:hidden_block) { create(:experience_block, experience: experience, status: :hidden) }

      it "includes only open blocks" do
        ids = visibility.visible_blocks.map(&:id)
        expect(ids).to include(open_block.id)
        expect(ids).not_to include(closed_block.id, hidden_block.id)
      end
    end

    context "lobby status" do
      let(:experience) { create(:experience, status: :lobby) }
      let(:visibility) { described_class.new(experience: experience, participant_role: :audience) }

      let!(:lobby_block) { create(:experience_block, experience: experience, status: :hidden, show_in_lobby: true) }
      let!(:non_lobby_block) { create(:experience_block, experience: experience, status: :hidden, show_in_lobby: false) }
      let!(:open_block) { create(:experience_block, experience: experience, status: :open) }

      it "includes lobby blocks and open blocks" do
        ids = visibility.visible_blocks.map(&:id)
        expect(ids).to include(lobby_block.id, open_block.id)
        expect(ids).not_to include(non_lobby_block.id)
      end
    end

    context "role targeting" do
      let(:visibility) { described_class.new(experience: experience, participant_role: :player) }

      let!(:global_block) { create(:experience_block, experience: experience, status: :open) }
      let!(:player_block) { create(:experience_block, experience: experience, status: :open, visible_to_roles: ["player"]) }
      let!(:audience_block) { create(:experience_block, experience: experience, status: :open, visible_to_roles: ["audience"]) }

      it "includes global and matching-role blocks, excludes others" do
        ids = visibility.visible_blocks.map(&:id)
        expect(ids).to include(global_block.id, player_block.id)
        expect(ids).not_to include(audience_block.id)
      end
    end

    context "segment targeting" do
      let(:visibility) { described_class.new(experience: experience, participant_role: :player, segments: ["vip"]) }

      let!(:global_block) { create(:experience_block, experience: experience, status: :open) }
      let!(:vip_block) { create(:experience_block, experience: experience, status: :open, visible_to_segment_names: ["vip"]) }
      let!(:premium_block) { create(:experience_block, experience: experience, status: :open, visible_to_segment_names: ["premium"]) }

      it "includes global and matching-segment blocks, excludes others" do
        ids = visibility.visible_blocks.map(&:id)
        expect(ids).to include(global_block.id, vip_block.id)
        expect(ids).not_to include(premium_block.id)
      end
    end

    context "multi-segment — OR logic" do
      let(:visibility) { described_class.new(experience: experience, participant_role: :player, segments: ["vip", "premium"]) }

      let!(:global_block) { create(:experience_block, experience: experience, status: :open) }
      let!(:vip_block) { create(:experience_block, experience: experience, status: :open, visible_to_segment_names: ["vip"]) }
      let!(:premium_block) { create(:experience_block, experience: experience, status: :open, visible_to_segment_names: ["premium"]) }
      let!(:beta_block) { create(:experience_block, experience: experience, status: :open, visible_to_segment_names: ["beta"]) }

      it "includes blocks matching any of the participant's segments" do
        ids = visibility.visible_blocks.map(&:id)
        expect(ids).to include(global_block.id, vip_block.id, premium_block.id)
        expect(ids).not_to include(beta_block.id)
      end
    end

    context "user_id targeting" do
      let(:target_user) { create(:user) }
      let(:other_user) { create(:user) }
      let(:visibility) { described_class.new(experience: experience, participant_role: :player, target_user_ids: [target_user.id]) }

      let!(:global_block) { create(:experience_block, experience: experience, status: :open) }
      let!(:targeted_block) { create(:experience_block, experience: experience, status: :open, target_user_ids: [target_user.id]) }
      let!(:other_targeted_block) { create(:experience_block, experience: experience, status: :open, target_user_ids: [other_user.id]) }

      it "includes global and user-targeted blocks, excludes others" do
        ids = visibility.visible_blocks.map(&:id)
        expect(ids).to include(global_block.id, targeted_block.id)
        expect(ids).not_to include(other_targeted_block.id)
      end
    end

    it "excludes child blocks for regular participants" do
      parent = create(:experience_block, experience: experience, status: :open)
      child = create(:experience_block, experience: experience, parent_block: parent, status: :open)
      visibility = described_class.new(experience: experience, participant_role: :player)

      expect(visibility.visible_blocks.map(&:id)).not_to include(child.id)
    end
  end

  describe "#block_visible?" do
    let(:visibility) { described_class.new(experience: experience, participant_role: :player, segments: ["vip"]) }

    let!(:vip_block) { create(:experience_block, experience: experience, status: :open, visible_to_segment_names: ["vip"]) }
    let!(:premium_block) { create(:experience_block, experience: experience, status: :open, visible_to_segment_names: ["premium"]) }

    it "returns true for blocks in visible_blocks" do
      expect(visibility.block_visible?(vip_block)).to be true
    end

    it "returns false for blocks not in visible_blocks" do
      expect(visibility.block_visible?(premium_block)).to be false
    end
  end

  describe "#resolve_block_for_user" do
    let(:participant_user) { create(:user, :user) }
    let!(:participant) { create(:experience_participant, user: participant_user, experience: experience, role: :player) }
    let(:visibility) do
      described_class.new(
        experience: experience,
        participant_role: :player,
        participant: participant
      )
    end

    context "with no visible blocks" do
      it "returns nil" do
        expect(visibility.resolve_block_for_user).to be_nil
      end
    end

    context "with simple blocks" do
      let!(:block1) { create(:experience_block, experience: experience, status: :open, position: 0) }
      let!(:block2) { create(:experience_block, experience: experience, status: :open, position: 1) }

      it "returns the first block" do
        expect(visibility.resolve_block_for_user).to eq(block1)
      end
    end

    context "when participant is nil" do
      let(:visibility) { described_class.new(experience: experience, participant_role: :player) }

      let!(:block) { create(:experience_block, experience: experience, status: :open) }

      it "returns nil" do
        expect(visibility.resolve_block_for_user).to be_nil
      end
    end

    context "with dependency blocks" do
      let!(:parent) { create(:experience_block, experience: experience, status: :open, position: 0) }
      let!(:child1) { create(:experience_block, experience: experience, parent_block: parent, status: :open, position: 0) }
      let!(:child2) { create(:experience_block, experience: experience, parent_block: parent, status: :open, position: 1) }

      before { create(:experience_block_link, parent_block: parent, child_block: child1) }

      it "returns the first unresolved child" do
        expect(visibility.resolve_block_for_user).to eq(child1)
      end
    end
  end

  describe "#next_block_for_user" do
    let(:participant_user) { create(:user, :user) }
    let!(:participant) { create(:experience_participant, user: participant_user, experience: experience, role: :player) }
    let(:visibility) do
      described_class.new(
        experience: experience,
        participant_role: :player,
        participant: participant
      )
    end

    context "with multiple visible blocks" do
      let!(:block1) { create(:experience_block, experience: experience, status: :open, position: 0) }
      let!(:block2) { create(:experience_block, experience: experience, status: :open, position: 1) }

      it "returns the second block" do
        expect(visibility.next_block_for_user).to eq(block2)
      end
    end

    context "with only one visible block" do
      let!(:block) { create(:experience_block, experience: experience, status: :open) }

      it "returns nil" do
        expect(visibility.next_block_for_user).to be_nil
      end
    end
  end

  describe ".admin_visible_blocks" do
    let!(:open_block) { create(:experience_block, experience: experience, status: :open, position: 0) }
    let!(:closed_block) { create(:experience_block, experience: experience, status: :closed, position: 1) }
    let!(:hidden_block) { create(:experience_block, experience: experience, status: :hidden, position: 2) }

    it "returns all parent blocks regardless of status" do
      ids = described_class.admin_visible_blocks(experience).map(&:id)
      expect(ids).to contain_exactly(open_block.id, closed_block.id, hidden_block.id)
    end

    it "excludes child blocks" do
      child = create(:experience_block, experience: experience, parent_block: open_block, status: :open)
      ids = described_class.admin_visible_blocks(experience).map(&:id)
      expect(ids).not_to include(child.id)
    end

    it "accepts preloaded blocks" do
      blocks = experience.experience_blocks.order(position: :asc).to_a
      ids = described_class.admin_visible_blocks(experience, blocks: blocks).map(&:id)
      expect(ids).to contain_exactly(open_block.id, closed_block.id, hidden_block.id)
    end
  end

  describe ".monitor_visible_blocks" do
    context "when live" do
      let!(:open_block) { create(:experience_block, experience: experience, status: :open, position: 0) }
      let!(:closed_block) { create(:experience_block, experience: experience, status: :closed, position: 1) }
      let!(:targeted_block) { create(:experience_block, experience: experience, status: :open, position: 2, visible_to_roles: ["player"]) }
      let!(:segment_block) { create(:experience_block, experience: experience, status: :open, position: 3, visible_to_segment_names: ["vip"]) }

      it "includes only open, untargeted blocks" do
        ids = described_class.monitor_visible_blocks(experience).map(&:id)
        expect(ids).to include(open_block.id)
        expect(ids).not_to include(closed_block.id, targeted_block.id, segment_block.id)
      end
    end

    context "when lobby" do
      let(:experience) { create(:experience, status: :lobby) }

      let!(:lobby_block) { create(:experience_block, experience: experience, status: :hidden, show_in_lobby: true, position: 0) }
      let!(:non_lobby_block) { create(:experience_block, experience: experience, status: :hidden, show_in_lobby: false, position: 1) }
      let!(:open_block) { create(:experience_block, experience: experience, status: :open, show_in_lobby: false, position: 2) }

      it "includes show_in_lobby blocks, excludes others" do
        ids = described_class.monitor_visible_blocks(experience).map(&:id)
        expect(ids).to include(lobby_block.id)
        expect(ids).not_to include(non_lobby_block.id, open_block.id)
      end
    end

    context "show_on_monitor payload flag" do
      let!(:hidden_from_monitor) do
        create(:experience_block, experience: experience, status: :open, position: 0,
               payload: { "show_on_monitor" => false })
      end
      let!(:visible_block) { create(:experience_block, experience: experience, status: :open, position: 1) }

      it "excludes blocks with show_on_monitor: false" do
        ids = described_class.monitor_visible_blocks(experience).map(&:id)
        expect(ids).to include(visible_block.id)
        expect(ids).not_to include(hidden_from_monitor.id)
      end
    end

    context "with dependency blocks" do
      let!(:parent) { create(:experience_block, experience: experience, status: :open, position: 0) }
      let!(:child) { create(:experience_block, experience: experience, parent_block: parent, status: :open, position: 0) }

      before { create(:experience_block_link, parent_block: parent, child_block: child) }

      it "yields the first child when it has no visibility rules" do
        ids = described_class.monitor_visible_blocks(experience).map(&:id)
        expect(ids).to include(child.id)
        expect(ids).not_to include(parent.id)
      end

      context "when the first child has visibility rules" do
        before { child.update!(visible_to_roles: ["player"]) }

        it "yields the parent instead" do
          ids = described_class.monitor_visible_blocks(experience).map(&:id)
          expect(ids).to include(parent.id)
          expect(ids).not_to include(child.id)
        end
      end

      context "for FAMILY_FEUD kind" do
        before { parent.update!(kind: ExperienceBlock::FAMILY_FEUD) }

        it "always yields the parent" do
          ids = described_class.monitor_visible_blocks(experience).map(&:id)
          expect(ids).to include(parent.id)
          expect(ids).not_to include(child.id)
        end
      end
    end

    it "accepts preloaded blocks" do
      open_block = create(:experience_block, experience: experience, status: :open)
      blocks = experience.experience_blocks.includes(:experience_segments).order(position: :asc).to_a

      ids = described_class.monitor_visible_blocks(experience, blocks: blocks).map(&:id)
      expect(ids).to include(open_block.id)
    end
  end

  describe ".resolve_block_for_admin" do
    it "returns the first parent block in position order" do
      block2 = create(:experience_block, experience: experience, status: :open, position: 1)
      block1 = create(:experience_block, experience: experience, status: :open, position: 0)
      blocks = described_class.admin_visible_blocks(experience)

      expect(described_class.resolve_block_for_admin(blocks)).to eq(block1)
    end

    it "returns the first child when the first parent has dependencies" do
      parent = create(:experience_block, experience: experience, status: :open, position: 0)
      child = create(:experience_block, experience: experience, parent_block: parent, status: :open, position: 0)
      create(:experience_block_link, parent_block: parent, child_block: child)

      blocks = described_class.admin_visible_blocks(experience)
      expect(described_class.resolve_block_for_admin(blocks)).to eq(child)
    end

    it "returns nil for empty blocks" do
      expect(described_class.resolve_block_for_admin([])).to be_nil
    end
  end

  describe ".serialize_for_api_response" do
    let(:user) { create(:user, :user) }
    let(:block) { create(:experience_block, experience: experience) }
    let(:visibility_payload) do
      { experience: { blocks: [{ id: block.id, kind: block.kind }], next_block: nil } }
    end

    it "includes blocks from the visibility payload" do
      result = described_class.serialize_for_api_response(experience, visibility_payload: visibility_payload)
      expect(result.dig(:experience, :blocks).first[:id]).to eq(block.id)
    end

    it "includes participant_block_active when present in payload" do
      payload = visibility_payload.deep_merge(experience: { participant_block_active: true })
      result = described_class.serialize_for_api_response(experience, visibility_payload: payload)
      expect(result.dig(:experience, :participant_block_active)).to be true
    end

    it "omits participant_block_active when absent from payload" do
      result = described_class.serialize_for_api_response(experience, visibility_payload: visibility_payload)
      expect(result[:experience]).not_to have_key(:participant_block_active)
    end
  end

  describe ".for_admin" do
    let!(:block1) { create(:experience_block, experience: experience, status: :open, position: 0) }
    let!(:block2) { create(:experience_block, experience: experience, status: :closed, position: 1) }
    let!(:block3) { create(:experience_block, experience: experience, status: :hidden, position: 2) }

    def block_ids(result)
      result.dig(:experience, :blocks).map { |b| b[:id] }
    end

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
    def block_ids(result)
      result.dig(:experience, :blocks).map { |b| b[:id] }
    end

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

    def block_ids(result)
      result.dig(:experience, :blocks).map { |b| b[:id] }
    end

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

  describe ".block_visible_to_user?" do
    let(:experience) { create(:experience, status: :live) }
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
