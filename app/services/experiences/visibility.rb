module Experiences
  # Determines which blocks are visible for a given context (admin, monitor, or participant),
  # builds visibility payloads, and formats complete experience responses for API
  # and websocket consumers.
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
          blocks: visible.map { |b| serialize_for_stream(b, participant_role: "host", submissions_cache: submissions_cache) },
          next_block: next_block ? serialize_for_stream(next_block, participant_role: "host", submissions_cache: submissions_cache) : nil
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
          serialize_for_user(block, participant_role: effective_role, user: user, submissions_cache: submissions_cache)
        end
        next_block = visibility.next_block_for_user
      else
        resolved = visibility.resolve_block_for_user
        serialized_blocks = resolved ? [serialize_for_user(resolved, participant_role: effective_role, user: user, submissions_cache: submissions_cache)] : []
        next_block = visibility.next_block_for_user
      end

      {
        experience: {
          blocks: serialized_blocks,
          next_block: next_block ? serialize_for_user(next_block, participant_role: effective_role, user: user, submissions_cache: submissions_cache) : nil
        }
      }
    end

    # Serializes a single block for a specific user. Used by the blocks controller
    # after submission actions to return the updated block state.
    def self.serialize_block_for_participant(block:, experience:, user:)
      participant_record = experience.experience_participants.find_by(user_id: user.id)

      if user.admin? || user.superadmin?
        effective_role = participant_record&.role || "host"
        return serialize_for_user(block, participant_role: effective_role, user: user)
      end

      return nil if participant_record.blank?

      serialize_for_user(block, participant_role: participant_record.role, user: user)
    end

    # Formats a complete experience response for API consumers.
    def self.serialize_for_api_response(experience, visibility_payload:, current_participant: nil, participants: nil)
      {
        type: "success",
        success: true,
        experience: serialize_experience(
          experience,
          visibility_payload: visibility_payload,
          include_participants: true,
          participants: participants
        ),
        participant: current_participant ? serialize_participant_summary(current_participant) : nil
      }
    end

    # Formats a complete experience response for websocket messages.
    def self.serialize_for_websocket_message(experience, visibility_payload:, include_participants: false, participants: nil)
      serialize_experience(
        experience,
        visibility_payload: visibility_payload,
        include_participants: include_participants,
        participants: participants
      )
    end

    def self.serialize_participants(participants)
      participants.map do |participant|
        {
          id: participant.id,
          user_id: participant.user.id,
          experience_id: participant.experience_id,
          name: participant.name,
          email: participant.user.email,
          status: participant.status,
          role: participant.role,
          segments: participant.segment_names,
          joined_at: participant.joined_at,
          fingerprint: participant.fingerprint,
          created_at: participant.created_at,
          updated_at: participant.updated_at
        }
      end
    end

    def self.serialize_participant_summary(participant)
      {
        id: participant.id,
        user_id: participant.user.id,
        name: participant.name,
        email: participant.user.email,
        role: participant.role
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

    def self.serialize_for_user(block, participant_role:, user:, submissions_cache: nil, depth: 0)
      serialize_block(block, participant_role: participant_role, user: user, submissions_cache: submissions_cache, depth: depth)
    end

    def self.serialize_for_stream(block, participant_role:, submissions_cache: nil, depth: 0)
      serialize_block(block, participant_role: participant_role, user: nil, submissions_cache: submissions_cache, depth: depth)
    end

    def self.serialize_block(block, participant_role:, user: nil, submissions_cache: nil, depth: 0)
      base_structure = {
        id: block.id,
        kind: block.kind,
        status: block.status,
        payload: block.payload
      }

      base_structure
        .merge(responses: serialize_response_data(block, participant_role, user, submissions_cache))
        .merge(serialize_visibility_metadata(block, participant_role, user))
        .merge(serialize_dag_metadata(block, participant_role, user, submissions_cache, depth))
    end

    def self.serialize_response_data(block, participant_role, user, submissions_cache = nil)
      case block.kind
      when ExperienceBlock::POLL
        submissions = if submissions_cache
          submissions_cache.dig(block.id)&.values || []
        else
          block.experience_poll_submissions
        end

        total = submissions.count
        user_response = if submissions_cache && user
          submissions_cache.dig(block.id, user.id)
        else
          submissions.find { |s| s.user_id == user&.id }
        end
        user_response_payload = format_user_response(user_response)

        response = {
          total: total,
          user_response: user_response_payload,
          user_responded: user_response.present?
        }

        if mod_or_host?(participant_role) && total > 0
          response[:aggregate] = calculate_poll_aggregate(submissions)
        else
          response[:aggregate] = mod_or_host?(participant_role) ? {} : nil
        end

        if mod_or_host?(participant_role) || user_admin_role?(user)
          response[:all_responses] = submissions.map do |submission|
            {
              id: submission.id,
              user_id: submission.user_id,
              answer: submission.answer,
              created_at: submission.created_at
            }
          end
        end

        response

      when ExperienceBlock::QUESTION
        submissions = if submissions_cache
          submissions_cache.dig(block.id)&.values || []
        else
          block.experience_question_submissions
        end

        total = submissions.count
        user_response = if submissions_cache && user
          submissions_cache.dig(block.id, user.id)
        else
          submissions.find { |s| s.user_id == user&.id }
        end

        response = {
          total: total,
          user_response: format_user_response(user_response),
          user_responded: user_response.present?
        }

        if mod_or_host?(participant_role) || user_admin_role?(user)
          response[:all_responses] = submissions.map do |submission|
            {
              id: submission.id,
              user_id: submission.user_id,
              answer: submission.answer,
              created_at: submission.created_at
            }
          end
        end

        response

      when ExperienceBlock::MULTISTEP_FORM
        submissions = if submissions_cache
          submissions_cache.dig(block.id)&.values || []
        else
          block.experience_multistep_form_submissions
        end

        total = submissions.count
        user_response = if submissions_cache && user
          submissions_cache.dig(block.id, user.id)
        else
          submissions.find { |s| s.user_id == user&.id }
        end

        response = {
          total: total,
          user_response: format_user_response(user_response),
          user_responded: user_response.present?
        }

        if mod_or_host?(participant_role) || user_admin_role?(user)
          response[:all_responses] = submissions.map do |submission|
            {
              id: submission.id,
              user_id: submission.user_id,
              answer: submission.answer,
              created_at: submission.created_at
            }
          end
        end

        response

      when ExperienceBlock::ANNOUNCEMENT
        {}

      when ExperienceBlock::MAD_LIB
        participant_record = block.experience.experience_participants.find_by(user_id: user&.id)

        resolved_variables = if participant_record
          BlockResolver.resolve_variables(
            block: block,
            participant: participant_record,
            submissions_cache: submissions_cache
          )
        else
          {}
        end

        total_responses = if block.has_dependencies?
          block.children.sum do |child|
            if submissions_cache
              (submissions_cache.dig(child.id)&.values || []).count
            else
              case child.kind
              when ExperienceBlock::QUESTION then child.experience_question_submissions.count
              when ExperienceBlock::POLL then child.experience_poll_submissions.count
              else 0
              end
            end
          end
        else
          0
        end

        {
          total: total_responses,
          user_response: nil,
          user_responded: false,
          resolved_variables: resolved_variables
        }

      when ExperienceBlock::PHOTO_UPLOAD
        submissions = block.experience_photo_upload_submissions.includes(photo_attachment: :blob)
        total = submissions.count
        user_response = submissions.find { |s| s.user_id == user&.id }

        response = {
          total: total,
          user_response: if user_response
            {
              id: user_response.id,
              answer: user_response.answer,
              photo_url: user_response.photo.attached? ? ActiveStorageUrlService.blob_url(user_response.photo.blob) : nil
            }
          end,
          user_responded: user_response.present?
        }

        if mod_or_host?(participant_role) || user_admin_role?(user)
          response[:all_responses] = submissions.map do |submission|
            {
              id: submission.id,
              user_id: submission.user_id,
              answer: submission.answer,
              photo_url: submission.photo.attached? ? ActiveStorageUrlService.blob_url(submission.photo.blob) : nil,
              created_at: submission.created_at
            }
          end
        end

        response

      when ExperienceBlock::BUZZER
        submissions = block.experience_buzzer_submissions.order(Arel.sql("answer->>'buzzed_at' ASC"))
        total = submissions.count
        user_response = submissions.find { |s| s.user_id == user&.id }

        {
          total: total,
          user_responded: user_response.present?,
          user_response: user_response ? { id: user_response.id, answer: user_response.answer } : nil,
          all_responses: submissions.map do |submission|
            {
              id: submission.id,
              user_id: submission.user_id,
              answer: submission.answer,
              created_at: submission.created_at
            }
          end
        }

      else
        {}
      end
    end

    def self.serialize_visibility_metadata(block, participant_role, user)
      return {} unless mod_or_host?(participant_role) || user_admin_role?(user)

      {
        visible_to_roles: block.visible_to_roles,
        visible_to_segments: block.visible_to_segment_names,
        target_user_ids: block.target_user_ids,
        show_in_lobby: block.show_in_lobby
      }
    end

    def self.serialize_dag_metadata(block, participant_role, user, submissions_cache = nil, depth = 0)
      return {} unless mod_or_host?(participant_role) || user_admin_role?(user)

      if submissions_cache
        metadata = {}

        metadata[:child_block_ids] = block.association(:children).loaded? ? block.children.map(&:id) : []
        metadata[:parent_block_ids] = block.association(:parents).loaded? ? block.parents.map(&:id) : []

        if depth == 0 && block.children.any?
          metadata[:children] = block.children.map do |child|
            serialize_block(child, participant_role: participant_role, user: user, submissions_cache: submissions_cache, depth: depth + 1)
          end
        end
      else
        metadata = {
          child_block_ids: block.children.pluck(:id),
          parent_block_ids: block.parents.pluck(:id)
        }

        if depth == 0 && block.children.exists?
          metadata[:children] = block.children.map do |child|
            serialize_block(child, participant_role: participant_role, user: user, submissions_cache: submissions_cache, depth: depth + 1)
          end
        end
      end

      if block.kind == ExperienceBlock::MAD_LIB
        metadata[:variables] = block.variables.map do |variable|
          {
            id: variable.id,
            key: variable.key,
            label: variable.label,
            datatype: variable.datatype,
            required: variable.required
          }
        end

        metadata[:variable_bindings] = block.variables.flat_map do |variable|
          variable.bindings.map do |binding|
            {
              id: binding.id,
              variable_id: binding.variable_id,
              source_block_id: binding.source_block_id
            }
          end
        end
      end

      metadata
    end

    def self.calculate_poll_aggregate(submissions)
      aggregate = {}
      submissions.each do |submission|
        selected_options = Array(submission.answer["selectedOptions"])
        selected_options.each do |option|
          aggregate[option] ||= 0
          aggregate[option] += 1
        end
      end
      aggregate
    end

    def self.format_user_response(user_response)
      return nil unless user_response
      {
        id: user_response.id,
        answer: {
          selectedOptions: Array(user_response.answer["selectedOptions"])
        }
      }
    end

    def self.mod_or_host?(participant_role)
      ["moderator", "host"].include?(participant_role.to_s)
    end

    def self.user_admin_role?(user)
      return false unless user
      ["admin", "superadmin"].include?(user.role.to_s)
    end

    def self.serialize_experience(experience, visibility_payload: nil, include_participants: false, participants: nil)
      blocks = visibility_payload&.dig(:experience, :blocks) || []
      next_block = visibility_payload&.dig(:experience, :next_block)
      participant_block_active = visibility_payload&.dig(:experience, :participant_block_active)

      base_url = Rails.application.config.app_base_url

      result = {
        id: experience.id,
        name: experience.name,
        code: experience.code,
        code_slug: experience.code_slug,
        url: "#{base_url}/experiences/#{experience.code_slug}",
        status: experience.status,
        description: experience.description,
        creator_id: experience.creator_id,
        created_at: experience.created_at,
        updated_at: experience.updated_at,
        blocks: blocks,
        next_block: next_block,
        playbill_enabled: experience.playbill_enabled,
        playbill: serialize_playbill(experience.playbill),
        segments: serialize_segments(experience)
      }

      result[:participant_block_active] = participant_block_active unless participant_block_active.nil?

      responded_participant_ids = visibility_payload&.dig(:experience, :responded_participant_ids)
      result[:responded_participant_ids] = responded_participant_ids unless responded_participant_ids.nil?

      if include_participants
        all_participants = participants || experience.experience_participants.includes(:user)

        result[:hosts] = serialize_participants(
          all_participants.select { |p| p.role == "host" }
        )

        result[:participants] = serialize_participants(all_participants)
      end

      result
    end

    def self.serialize_segments(experience)
      experience.experience_segments.order(position: :asc).map do |segment|
        {
          id: segment.id,
          name: segment.name,
          color: segment.color,
          position: segment.position
        }
      end
    end

    def self.serialize_playbill(playbill)
      return [] unless playbill.is_a?(Array)

      playbill.map do |section|
        resolved = section.dup
        if section["image_signed_id"].present?
          blob = ActiveStorage::Blob.find_signed(section["image_signed_id"])
          resolved["image_url"] = blob ? ActiveStorageUrlService.blob_url(blob) : nil
        end
        resolved
      end
    end

    def self.resolve_monitor_entry(parent, direct_children)
      sorted = direct_children.sort_by(&:position)
      return [parent] if sorted.empty?
      return [parent] if parent.kind == ExperienceBlock::FAMILY_FEUD

      first_child = sorted.first
      first_child.has_visibility_rules? ? [parent] : [first_child]
    end

    def self.serialize_monitor_block(experience, block, participants: nil, blocks: nil, submissions_cache: nil)
      serialized = serialize_for_stream(block, participant_role: "host", submissions_cache: submissions_cache)

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

    private_class_method :serialize_for_user, :serialize_for_stream, :serialize_block,
                         :serialize_response_data,
                         :serialize_visibility_metadata, :serialize_dag_metadata,
                         :calculate_poll_aggregate, :format_user_response,
                         :mod_or_host?, :user_admin_role?,
                         :resolve_monitor_entry, :serialize_monitor_block,
                         :responded_participant_ids, :participant_block_active?,
                         :serialize_experience, :serialize_segments, :serialize_playbill
  end
end
