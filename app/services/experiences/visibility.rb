module Experiences
  class Visibility
    attr_reader :experience, :user_role, :participant_role, :segments, :target_user_ids

    # Returns all parent blocks — no filtering. Used for admin/host full view.
    def self.admin_visible_blocks(experience, blocks: nil)
      source = blocks || experience.experience_blocks.order(position: :asc).to_a
      source.select(&:parent_block?)
    end

    # Returns parent blocks visible on the monitor — public, untargeted, not hidden from monitor.
    # When a parent has dependencies, yields the first visible child (or the parent for FAMILY_FEUD).
    def self.monitor_visible_blocks(experience, blocks: nil)
      all_blocks = blocks || experience.experience_blocks
        .includes(:experience_segments)
        .order(position: :asc)
        .to_a

      parent_blocks = all_blocks.select(&:parent_block?)
      children_by_parent_id = all_blocks
        .reject { |b| b.parent_block_id.nil? }
        .group_by(&:parent_block_id)

      filtered = if experience.status == "lobby"
        parent_blocks.select { |b| b.show_in_lobby? && !b.has_visibility_rules? }
      else
        parent_blocks.select { |b| b.open? && !b.has_visibility_rules? }
      end

      filtered
        .reject { |b| b.payload["show_on_monitor"] == false }
        .sort_by(&:position)
        .flat_map { |parent| resolve_monitor_entry(parent, children_by_parent_id[parent.id] || []) }
    end

    # Resolves the current block for admin view based on position and dependency ordering.
    def self.resolve_block_for_admin(blocks)
      blocks.sort_by(&:position).each do |block|
        if block.has_dependencies?
          first_child = block.children.min_by(&:position)
          return first_child if first_child
        end
        return block
      end
      nil
    end

    # Checks whether a block is visible to a specific user. Used by policy layer.
    # Parent blocks are checked via visible_blocks. Child blocks are checked directly
    # against their own status and targeting rules.
    def self.block_visible_to_user?(block:, user:)
      return true if user.admin? || user.superadmin?

      participant = block.experience.experience_participants.find_by(user_id: user.id)
      return false if participant.blank?

      instance = new(
        experience: block.experience,
        participant_role: participant.role,
        segments: participant.segment_names,
        target_user_ids: [user.id]
      )

      block.parent_block? ? instance.block_visible?(block) : instance.block_accessible?(block)
    end

    def initialize(
      experience:,
      user_role: nil,
      participant_role: nil,
      segments: [],
      target_user_ids: [],
      preloaded_blocks: nil,
      submissions_cache: nil,
      participant: nil,
      participants_by_user_id: nil
    )
      @experience = experience
      @user_role = user_role
      @participant_role = participant_role
      @segments = segments || []
      @target_user_ids = target_user_ids || []
      @preloaded_blocks = preloaded_blocks
      @submissions_cache = submissions_cache
      @participant = participant
      @participants_by_user_id = participants_by_user_id
    end

    # Returns parent blocks visible to this context.
    def visible_blocks
      @visible_blocks ||= begin
        source = @preloaded_blocks || experience.experience_blocks
          .includes(:experience_segments)
          .order(position: :asc)
        parent_blocks = source.select(&:parent_block?)

        return parent_blocks if user_admin?
        return [] if participant_role.nil?

        parent_blocks
          .select { |block| moderator_or_host? || block.visible_by_status?(experience) }
          .select { |block| moderator_or_host? || block.visible_to?(role: participant_role, segments: segments, user_id: target_user_ids.first) }
      end
    end

    def block_visible?(block)
      visible_blocks.include?(block)
    end

    # Checks a single block's own status and targeting rules without requiring it
    # to be a parent. Used for child block authorization in the policy layer.
    def block_accessible?(block)
      return true if user_admin?
      return true if moderator_or_host?

      block.visible_by_status?(experience) &&
        block.visible_to?(role: participant_role, segments: segments, user_id: target_user_ids.first)
    end

    # Resolves the single block a participant should currently see, respecting dependencies.
    def resolve_block_for_user
      return nil unless @participant

      resolve_from(visible_blocks)
    end

    # Returns the block after the current resolved block.
    def next_block_for_user
      current = resolve_block_for_user
      return nil unless current

      resolve_from(visible_blocks.reject { |b| b == current })
    end

    def moderator_or_host?
      participant_role.to_s.in?(%w[moderator host])
    end

    def user_admin?
      user_role.to_s.in?(%w[admin superadmin])
    end

    private

    def resolve_from(blocks)
      return nil if blocks.empty?

      blocks.sort_by(&:position).each do |block|
        if block.has_dependencies?
          unresolved_child = BlockResolver.next_unresolved_child(
            block: block,
            participant: @participant,
            submissions_cache: @submissions_cache
          )
          return unresolved_child if unresolved_child
        end
        return block
      end

      nil
    end

    def self.resolve_monitor_entry(parent, direct_children)
      sorted = direct_children.sort_by(&:position)
      return [parent] if sorted.empty?
      return [parent] if parent.kind == ExperienceBlock::FAMILY_FEUD

      first_child = sorted.first
      first_child.has_visibility_rules? ? [parent] : [first_child]
    end
    private_class_method :resolve_monitor_entry
  end
end
