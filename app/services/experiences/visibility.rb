module Experiences
  # Determines which blocks are visible for a given context (admin, monitor, or participant),
  # and builds the visibility payload — the serialized block data for each stream type.
  # ExperienceSerializer consumes this payload to format final API/websocket responses.
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

    # Builds the visibility payload for the admin stream.
    def self.for_admin(experience:, blocks: nil, submissions_cache: nil)
      visible = admin_visible_blocks(experience, blocks: blocks)
      current_block = resolve_block_for_admin(visible)
      next_block = current_block ? resolve_block_for_admin(visible.reject { |b| b == current_block }) : nil

      {
        experience: {
          blocks: visible.map { |b| BlockSerializer.serialize_for_stream(b, participant_role: "host", submissions_cache: submissions_cache) },
          next_block: next_block ? BlockSerializer.serialize_for_stream(next_block, participant_role: "host", submissions_cache: submissions_cache) : nil
        }
      }
    end

    # Builds the visibility payload for the monitor stream.
    def self.for_monitor(experience:, blocks: nil, participants: nil, submissions_cache: nil)
      visible = monitor_visible_blocks(experience, blocks: blocks)
      current_block = visible.first
      next_block = visible.second

      {
        experience: {
          blocks: current_block ? [serialize_monitor_block(experience, current_block, participants: participants, blocks: blocks, submissions_cache: submissions_cache)] : [],
          next_block: next_block ? serialize_monitor_block(experience, next_block, participants: participants, blocks: blocks, submissions_cache: submissions_cache) : nil,
          participant_block_active: participant_block_active?(experience, blocks: blocks),
          responded_participant_ids: responded_participant_ids(experience, blocks: blocks, participants: participants, submissions_cache: submissions_cache)
        }
      }
    end

    # Builds the visibility payload for a single participant's stream.
    def self.for_participant(experience:, user:, participant: nil, blocks: nil, submissions_cache: nil, participants_by_user_id: nil)
      participant_record = participant ||
        participants_by_user_id&.dig(user.id) ||
        experience.experience_participants.find_by(user_id: user.id)

      if participant_record.blank? && !(user.admin? || user.superadmin?)
        return { experience: { blocks: [], next_block: nil } }
      end

      visibility = new(
        experience: experience,
        user_role: user.role,
        participant_role: participant_record&.role,
        segments: participant_record&.segment_names || [],
        target_user_ids: [user.id],
        preloaded_blocks: blocks,
        submissions_cache: submissions_cache,
        participant: participant_record,
        participants_by_user_id: participants_by_user_id
      )

      effective_role = participant_record&.role || "host"

      if visibility.moderator_or_host? || visibility.user_admin?
        serialized_blocks = visibility.visible_blocks.map do |block|
          BlockSerializer.serialize_for_user(block, participant_role: effective_role, user: user, submissions_cache: submissions_cache)
        end
        next_block = visibility.next_block_for_user
      else
        resolved = visibility.resolve_block_for_user
        serialized_blocks = resolved ? [BlockSerializer.serialize_for_user(resolved, participant_role: effective_role, user: user, submissions_cache: submissions_cache)] : []
        next_block = visibility.next_block_for_user
      end

      {
        experience: {
          blocks: serialized_blocks,
          next_block: next_block ? BlockSerializer.serialize_for_user(next_block, participant_role: effective_role, user: user, submissions_cache: submissions_cache) : nil
        }
      }
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

    def self.serialize_monitor_block(experience, block, participants: nil, blocks: nil, submissions_cache: nil)
      serialized = BlockSerializer.serialize_for_stream(block, participant_role: "host", submissions_cache: submissions_cache)

      if block.kind == ExperienceBlock::MAD_LIB
        participant_list = participants || experience.experience_participants
        all_resolved_variables = participant_list.each_with_object({}) do |participant, vars|
          vars.merge!(BlockResolver.resolve_variables(block: block, participant: participant, submissions_cache: submissions_cache))
        end
        serialized[:responses][:resolved_variables] = all_resolved_variables
      end

      serialized
    end

    def self.responded_participant_ids(experience, blocks: nil, participants: nil, submissions_cache: nil)
      all_blocks = blocks || experience.experience_blocks.to_a
      participant_list = participants || experience.experience_participants.to_a

      active_blocks = all_blocks.select do |block|
        block.parent_block_id.nil? &&
          block.status == "open" &&
          block.visible_to_roles.empty? &&
          block.target_user_ids.empty? &&
          !block.experience_segments.any?
      end

      return [] if active_blocks.empty?

      responded_user_ids = Set.new

      if submissions_cache
        active_blocks.each do |block|
          (submissions_cache[block.id] || {}).each_key { |uid| responded_user_ids.add(uid) }
          all_blocks.select { |b| b.parent_block_id == block.id }.each do |child|
            (submissions_cache[child.id] || {}).each_key { |uid| responded_user_ids.add(uid) }
          end
        end
      else
        block_ids = active_blocks.flat_map do |b|
          [b.id] + all_blocks.select { |c| c.parent_block_id == b.id }.map(&:id)
        end
        [
          ExperiencePollSubmission,
          ExperienceQuestionSubmission,
          ExperienceMultistepFormSubmission,
          ExperienceMadLibSubmission
        ].each do |klass|
          klass.where(experience_block_id: block_ids).distinct.pluck(:user_id).each do |uid|
            responded_user_ids.add(uid)
          end
        end
      end

      user_to_participant = participant_list.each_with_object({}) { |p, h| h[p.user_id] = p.id }
      responded_user_ids.filter_map { |uid| user_to_participant[uid] }
    end

    def self.participant_block_active?(experience, blocks: nil)
      if blocks
        blocks.any? do |block|
          block.parent_block_id.nil? &&
            block.status == "open" &&
            block.visible_to_roles.empty? &&
            block.target_user_ids.empty? &&
            !block.experience_segments.any? &&
            block.payload["show_on_monitor"] == false
        end
      else
        experience.parent_blocks
          .where(status: "open")
          .where(visible_to_roles: [], target_user_ids: [])
          .where.missing(:experience_block_segments)
          .any? { |b| b.payload["show_on_monitor"] == false }
      end
    end

    private_class_method :resolve_monitor_entry, :serialize_monitor_block,
                         :responded_participant_ids, :participant_block_active?
  end
end
