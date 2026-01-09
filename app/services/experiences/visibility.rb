module Experiences
  class Visibility
    attr_reader(
      :experience, :user_role, :participant_role, :segments, :target_user_ids
    )

    def self.payload_for_admin(experience:, blocks: nil, submissions_cache: nil)
      visible_blocks = blocks || admin_visible_blocks(experience)
      
      serialized_blocks = visible_blocks.reject(&:child_block?).map do |block|
        BlockSerializer.serialize_for_stream(block, participant_role: "host", submissions_cache: submissions_cache)
      end

      current_block = resolve_block_for_admin(experience: experience, blocks: visible_blocks)
      blocks_without_current = current_block ? visible_blocks.reject { |b| b == current_block } : visible_blocks
      next_block = resolve_block_for_admin(experience: experience, blocks: blocks_without_current)

      serialized_next = if next_block
        BlockSerializer.serialize_for_stream(next_block, participant_role: "host", submissions_cache: submissions_cache)
      else
        nil
      end

      {
        experience: experience_structure(
          experience,
          serialized_blocks,
          next_block: serialized_next
        )
      }
    end

    def self.next_block_for_admin(experience:)
      visible_blocks = admin_visible_blocks(experience)
      current_block = resolve_block_for_admin(experience: experience, blocks: visible_blocks)
      return nil unless current_block

      blocks_without_current = visible_blocks.reject { |b| b == current_block }
      resolve_block_for_admin(experience: experience, blocks: blocks_without_current)
    end

    def self.next_block_for_monitor(experience:)
      visible_blocks = monitor_visible_blocks(experience)
      current_block = visible_blocks.first
      return nil unless current_block

      blocks_without_current = visible_blocks.reject { |b| b == current_block }
      blocks_without_current.first
    end

    def self.admin_visible_blocks(experience)
      experience.experience_blocks.order(position: :asc)
    end

    def self.resolve_block_for_admin(experience:, blocks:)
      return nil if blocks.empty?

      parent_blocks = blocks.reject(&:child_block?)

      parent_blocks.sort_by(&:position).each do |block|
        if block.has_dependencies?
          first_child = block.child_blocks.order(position: :asc).first
          return first_child if first_child
        end
        return block
      end

      nil
    end

    def self.payload_for_user(experience:, user:, participant: nil, blocks: nil, submissions_cache: nil, participants_by_user_id: nil)
      participant_record = participant || (participants_by_user_id&.dig(user.id)) || experience
        .experience_participants
        .find_by(user_id: user.id)

      # Admin users can see everything even without being participants
      if user.admin? || user.superadmin?
        return new(
          experience: experience,
          user_role: user.role,
          participant_role: participant_record&.role,
          segments: participant_record&.segments || [],
          target_user_ids: [user.id],
          preloaded_blocks: blocks,
          submissions_cache: submissions_cache,
          participant: participant_record,
          participants_by_user_id: participants_by_user_id
        ).payload_for_user(user)
      end

      if participant_record.blank?
        return { experience: experience_structure(experience, []) }
      end

      new(
        experience: experience,
        user_role: user.role,
        participant_role: participant_record.role,
        segments: participant_record.segments,
        target_user_ids: [user.id],
        preloaded_blocks: blocks,
        submissions_cache: submissions_cache,
        participant: participant_record,
        participants_by_user_id: participants_by_user_id
      ).payload_for_user(user)
    end

    def self.payload_for_stream(
      experience:, role:, segments: [], target_user_ids: []
    )
      new(
        experience: experience,
        participant_role: role,
        segments: segments,
        target_user_ids: target_user_ids
      ).payload
    end

    def self.payload_for_monitor(experience:, blocks: nil, participants: nil, submissions_cache: nil)
      visible_blocks = blocks ? monitor_visible_blocks_from_preloaded(experience, blocks) : monitor_visible_blocks(experience)

      current_block = visible_blocks.first
      serialized_blocks = if current_block
        [serialize_block_for_monitor(experience: experience, block: current_block, participants: participants, submissions_cache: submissions_cache)]
      else
        []
      end

      next_block = visible_blocks.second
      serialized_next = if next_block
        serialize_block_for_monitor(experience: experience, block: next_block, participants: participants, submissions_cache: submissions_cache)
      else
        nil
      end

      {
        experience: experience_structure(
          experience,
          serialized_blocks,
          next_block: serialized_next
        )
      }
    end

    def self.monitor_visible_blocks(experience)
      parent_blocks = if experience.status == 'lobby'
        experience.parent_blocks
          .where(show_in_lobby: true)
          .where(visible_to_roles: [], visible_to_segments: [], target_user_ids: [])
          .order(position: :asc)
      else
        experience.parent_blocks
          .where(status: 'open')
          .where(visible_to_roles: [], visible_to_segments: [], target_user_ids: [])
          .order(position: :asc)
      end

      result = []
      parent_blocks.each do |parent|
        if parent.has_dependencies?
          if parent.kind == ExperienceBlock::FAMILY_FEUD
            result << parent
          else
            first_child = parent.child_blocks.order(position: :asc).first
            if first_child && !has_visibility_rules?(first_child)
              result << first_child
            else
              result << parent
            end
          end
        else
          result << parent
        end
      end

      result
    end

    def self.monitor_visible_blocks_from_preloaded(experience, blocks)
      parent_blocks = blocks.select(&:parent_block?)

      parent_blocks = if experience.status == 'lobby'
        parent_blocks.select do |block|
          block.show_in_lobby? &&
            block.visible_to_roles.empty? &&
            block.visible_to_segments.empty? &&
            block.target_user_ids.empty?
        end
      else
        parent_blocks.select do |block|
          block.status == 'open' &&
            block.visible_to_roles.empty? &&
            block.visible_to_segments.empty? &&
            block.target_user_ids.empty?
        end
      end

      parent_blocks = parent_blocks.sort_by(&:position)

      result = []
      parent_blocks.each do |parent|
        if parent.has_dependencies?
          if parent.kind == ExperienceBlock::FAMILY_FEUD
            result << parent
          else
            first_child = parent.children.min_by(&:position)
            if first_child && !has_visibility_rules?(first_child)
              result << first_child
            else
              result << parent
            end
          end
        else
          result << parent
        end
      end

      result
    end

    def self.has_visibility_rules?(block)
      block.visible_to_roles.present? ||
        block.visible_to_segments.present? ||
        block.target_user_ids.present?
    end

    def self.serialize_block_for_monitor(experience:, block:, participants: nil, submissions_cache: nil)
      serialized = BlockSerializer.serialize_for_stream(
        block,
        participant_role: "host",
        submissions_cache: submissions_cache
      )

      if block.kind == ExperienceBlock::MAD_LIB
        all_resolved_variables = {}

        participant_list = participants || experience.experience_participants
        participant_list.each do |participant|
          participant_vars = Experiences::BlockResolver.resolve_variables(
            block: block,
            participant: participant,
            submissions_cache: submissions_cache
          )
          all_resolved_variables.merge!(participant_vars)
        end

        serialized[:responses][:resolved_variables] =
          all_resolved_variables
      end

      serialized
    end

    def self.block_visible_to_user?(block:, user:)
      return true if user.admin? || user.superadmin?

      participant_record = block
        .experience
        .experience_participants
        .find_by(user_id: user.id)

      return false if participant_record.blank?

      new(
        experience: block.experience,
        user_role: user.role,
        participant_role: participant_record.role,
        segments: participant_record.segments,
        target_user_ids: [user.id]
      ).block_visible?(block)
    end

    def self.serialize_block_for_user(experience:, user:, block:)
      participant_record = experience
        .experience_participants
        .find_by(user_id: user.id)

      # Treat admin's as host-level permissions when they are not participants
      if user.admin? || user.superadmin?
        effective_participant_role = participant_record&.role || "host"

        return BlockSerializer.serialize_for_user(
          block, participant_role: effective_participant_role, user: user
        )
      end

      return nil if participant_record.blank?

      BlockSerializer.serialize_for_user(
        block, participant_role: participant_record.role, user: user
      )
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

    def payload_for_user(user)
      blocks = if moderator_or_host? || user_admin?
        parent_blocks_only = visible_blocks.reject(&:child_block?)
        parent_blocks_only.map { |block| serialize_block_for_user(block, user) }
      else
        resolved_block = resolve_block_for_user(user)
        resolved_block ? [serialize_block_for_user(resolved_block, user)] : []
      end

      next_block = next_block_for_user(user)

      {
        experience: self.class.experience_structure(
          experience,
          blocks,
          next_block: next_block ? serialize_block_for_user(next_block, user) : nil
        )
      }
    end

    def payload
      {
        experience: self.class.experience_structure(
          experience,
          visible_blocks.map { |block| serialize_block_for_stream(block) }
        )
      }
    end

    def block_visible?(block)
      visible_blocks.include?(block)
    end

    def block_visible_to_user?(block)
      block_visible?(block)
    end

    def block_visible_to_stream?(block)
      block_visible?(block)
    end

    def resolve_block_for_user(user, blocks: visible_blocks)
      return nil if blocks.empty?

      parent_blocks = blocks.reject(&:child_block?)

      participant_record = @participant || (@participants_by_user_id&.dig(user.id)) || experience
        .experience_participants
        .find_by(user_id: user.id)
      return nil unless participant_record

      parent_blocks.sort_by(&:position).each do |block|
        if block.has_dependencies?
          unresolved_child = BlockResolver.next_unresolved_child(
            block: block,
            participant: participant_record,
            submissions_cache: @submissions_cache
          )

          return unresolved_child if unresolved_child
          return block
        else
          return block
        end
      end

      nil
    end

    def next_block_for_user(user)
      current_block = resolve_block_for_user(user)
      return nil unless current_block

      # Get all visible blocks except the current resolved block
      blocks_without_current = visible_blocks.reject { |b| b == current_block }

      # Use the same resolution logic on the remaining blocks
      resolve_block_for_user(user, blocks: blocks_without_current)
    end

    def visible_blocks
      @visible_blocks ||= begin
        blocks = @preloaded_blocks || experience.experience_blocks.order(position: :asc)

        return blocks if user_admin?
        return [] if participant_role.nil?

        blocks
          .select { |block| moderator_or_host? || block_visible_by_status?(block) }
          .select { |block| rules_allow_block?(block) }
      end
    end

    private

    def user_admin?
      user_role == "admin" || user_role == "superadmin"
    end

    def moderator_or_host?
      ["moderator", "host"].include?(participant_role.to_s)
    end

    def block_visible_by_status?(block)
      return true if block.open?
      return true if experience.status == "lobby" && block.show_in_lobby?

      false
    end

    def rules_allow_block?(block)
      return true if moderator_or_host?

      targeting_rules_exist = block.visible_to_roles.present? ||
        block.visible_to_segments.present? ||
        block.target_user_ids.present?

      return true unless targeting_rules_exist

      allowed_from_roles?(block) ||
        allowed_from_segments?(block) ||
        allowed_from_user_target?(block)
    end

    def allowed_from_roles?(block)
      block.visible_to_roles.include?(participant_role.to_s)
    end

    def allowed_from_segments?(block)
      (block.visible_to_segments & segments).any?
    end

    def allowed_from_user_target?(block)
      (block.target_user_ids.map(&:to_s) & target_user_ids.map(&:to_s)).any?
    end

    def serialize_block_for_user(block, user)
      BlockSerializer.serialize_for_user(
        block, participant_role: participant_role, user: user, submissions_cache: @submissions_cache
      )
    end

    def serialize_block_for_stream(block)
      BlockSerializer.serialize_for_stream(
        block, participant_role: participant_role, submissions_cache: @submissions_cache
      )
    end

    def self.experience_structure(experience, blocks, next_block: nil)
      {
        id: experience.id,
        code: experience.code,
        status: experience.status,
        started_at: experience.started_at,
        ended_at: experience.ended_at,
        blocks: blocks,
        next_block: next_block
      }
    end
  end
end
