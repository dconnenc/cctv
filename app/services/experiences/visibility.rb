module Experiences
  # Determines which blocks are visible for a given context and builds the complete
  # experience payload for each stream type (admin, monitor, participant).
  class Visibility
    def self.for_admin(experience)
      new(experience).for_admin
    end

    def self.for_monitor(experience)
      new(experience).for_monitor
    end

    def self.for_participant(experience, participant)
      new(experience).for_participant(participant)
    end

    def self.block_visible_to_user?(block:, user:)
      new(block.experience).block_visible_to_user?(block, user)
    end

    def initialize(experience)
      @experience = experience
    end

    def for_admin
      visible = admin_visible_blocks

      experience_payload(
        blocks: visible.map { |b| serialize_block(b, participant_role: "host") }
      )
    end

    def for_monitor
      visible = monitor_visible_blocks
      current = visible.first

      experience_payload(
        blocks:                    current ? [serialize_monitor_block(current)] : [],
        participant_block_active:  participant_block_active?,
        responded_participant_ids: responded_participant_ids
      )
    end

    def for_participant(participant)
      visible = participant_visible_blocks(participant)
      role    = participant.role

      if host_or_moderator?(role)
        blocks = visible.map { |b| serialize_block(b, participant_role: role, user: participant.user) }
      else
        current = resolve_participant_block(visible, participant)
        blocks  = current ? [serialize_block(current, participant_role: role, user: participant.user)] : []
      end

      experience_payload(blocks: blocks)
    end

    def block_visible_to_user?(block, user)
      return true if user.admin? || user.superadmin?

      participant = @experience.experience_participants.find_by(user_id: user.id)
      return false if participant.blank?

      if block.parent_block?
        participant_visible_blocks(participant).include?(block)
      else
        block.visible_by_status?(@experience) &&
          block.visible_to?(role: participant.role, segments: participant.segment_names, user_id: participant.user_id)
      end
    end

    private

    def admin_visible_blocks
      @experience.experience_blocks.order(position: :asc).select(&:parent_block?)
    end

    def monitor_visible_blocks
      all     = @experience.experience_blocks.includes(:experience_segments).order(position: :asc).to_a
      parents = all.select(&:parent_block?)
      children_by_parent = all.reject { |b| b.parent_block_id.nil? }.group_by(&:parent_block_id)

      candidates = if @experience.status == "lobby"
        parents.select { |b| b.show_in_lobby? && !b.has_visibility_rules? }
      else
        parents.select { |b| b.open? && !b.has_visibility_rules? }
      end

      candidates
        .reject { |b| b.payload["show_on_monitor"] == false }
        .sort_by(&:position)
        .flat_map { |parent| resolve_monitor_entry(parent, children_by_parent[parent.id] || []) }
    end

    def participant_visible_blocks(participant)
      all     = @experience.experience_blocks.includes(:experience_segments).order(position: :asc).to_a
      parents = all.select(&:parent_block?)

      return parents if host_or_moderator?(participant.role)
      return parents if participant.user.admin? || participant.user.superadmin?

      parents
        .select { |b| b.visible_by_status?(@experience) }
        .select { |b| b.visible_to?(role: participant.role, segments: participant.segment_names, user_id: participant.user_id) }
    end

    def resolve_participant_block(blocks, participant)
      blocks.sort_by(&:position).each do |block|
        if block.has_dependencies?
          unresolved = BlockResolver.next_unresolved_child(block: block, participant: participant)
          return unresolved if unresolved
        end
        return block
      end
      nil
    end

    def resolve_monitor_entry(parent, children)
      sorted = children.sort_by(&:position)
      return [parent] if sorted.empty?
      return [parent] if parent.kind == ExperienceBlock::FAMILY_FEUD

      first = sorted.first
      first.has_visibility_rules? ? [parent] : [first]
    end

    def participant_block_active?
      @experience.parent_blocks
        .where(status: "open")
        .where(visible_to_roles: [], target_user_ids: [])
        .where.missing(:experience_block_segments)
        .any? { |b| b.payload["show_on_monitor"] == false }
    end

    def responded_participant_ids
      active_block_ids = @experience.parent_blocks
        .where(status: "open")
        .where(visible_to_roles: [], target_user_ids: [])
        .where.missing(:experience_block_segments)
        .pluck(:id)

      return [] if active_block_ids.empty?

      child_block_ids  = ExperienceBlock.where(parent_block_id: active_block_ids).pluck(:id)
      all_block_ids    = active_block_ids + child_block_ids

      responded_user_ids = [
        ExperiencePollSubmission,
        ExperienceQuestionSubmission,
        ExperienceMadLibSubmission
      ].flat_map { |klass| klass.where(experience_block_id: all_block_ids).distinct.pluck(:user_id) }.uniq

      @experience.experience_participants.where(user_id: responded_user_ids).pluck(:id)
    end

    # --- Block serialization ---

    def serialize_block(block, participant_role:, user: nil, depth: 0)
      {
        id:      block.id,
        kind:    block.kind,
        status:  block.status,
        payload: block.payload
      }
        .merge(responses: serialize_response_data(block, participant_role, user))
        .merge(visibility_metadata(block, participant_role, user))
        .merge(dag_metadata(block, participant_role, user, depth))
    end

    def serialize_monitor_block(block)
      serialized = serialize_block(block, participant_role: "host")

      if block.kind == ExperienceBlock::MAD_LIB
        all_resolved = @experience.experience_participants.each_with_object({}) do |participant, vars|
          vars.merge!(BlockResolver.resolve_variables(block: block, participant: participant))
        end
        serialized[:responses][:resolved_variables] = all_resolved
      end

      serialized
    end

    def serialize_response_data(block, participant_role, user)
      case block.kind
      when ExperienceBlock::POLL
        submissions  = block.experience_poll_submissions.to_a
        user_response = submissions.find { |s| s.user_id == user&.id }

        response = {
          total:          submissions.count,
          user_response:  format_poll_response(user_response),
          user_responded: user_response.present?
        }

        if mod_or_host?(participant_role) && submissions.any?
          response[:aggregate] = calculate_poll_aggregate(submissions)
        else
          response[:aggregate] = mod_or_host?(participant_role) ? {} : nil
        end

        if mod_or_host?(participant_role) || admin_user?(user)
          response[:all_responses] = submissions.map { |s| submission_payload(s) }
        end

        response

      when ExperienceBlock::QUESTION
        submissions = block.experience_question_submissions.to_a
        response = { total: submissions.count }

        if mod_or_host?(participant_role) || admin_user?(user)
          user_response = submissions.find { |s| s.user_id == user&.id }
          response[:user_response]  = user_response ? { id: user_response.id, answer: user_response.answer } : nil
          response[:user_responded] = user_response.present?
          response[:all_responses]  = submissions.map { |s| submission_payload(s) }
        end

        response

      when ExperienceBlock::ANNOUNCEMENT
        {}

      when ExperienceBlock::MAD_LIB
        participant    = user && @experience.experience_participants.find_by(user_id: user.id)
        resolved_vars  = participant ? BlockResolver.resolve_variables(block: block, participant: participant) : {}
        total          = block.has_dependencies? ? block.children.sum { |c| c.experience_question_submissions.count + c.experience_poll_submissions.count } : 0

        { total: total, user_response: nil, user_responded: false, resolved_variables: resolved_vars }

      when ExperienceBlock::PHOTO_UPLOAD
        submissions   = block.experience_photo_upload_submissions.includes(photo_attachment: :blob).to_a
        user_response = submissions.find { |s| s.user_id == user&.id }

        response = {
          total:          submissions.count,
          user_response:  user_response && { id: user_response.id, answer: user_response.answer, photo_url: attachment_url(user_response.photo) },
          user_responded: user_response.present?
        }

        if mod_or_host?(participant_role) || admin_user?(user)
          response[:all_responses] = submissions.map { |s| submission_payload(s).merge(photo_url: attachment_url(s.photo)) }
        end

        response

      when ExperienceBlock::BUZZER
        submissions   = block.experience_buzzer_submissions.order(Arel.sql("answer->>'buzzed_at' ASC")).to_a
        user_response = submissions.find { |s| s.user_id == user&.id }
        winner        = submissions.first
        winner_avatar = winner && @experience.experience_participants.find_by(user_id: winner.user_id)&.avatar&.presence

        {
          total:          submissions.count,
          user_response:  user_response ? { id: user_response.id, answer: user_response.answer } : nil,
          user_responded: user_response.present?,
          all_responses:  submissions.map.with_index do |s, i|
            entry = submission_payload(s)
            entry[:avatar] = winner_avatar if i == 0 && winner_avatar
            entry
          end
        }

      else
        {}
      end
    end

    def visibility_metadata(block, participant_role, user)
      return {} unless mod_or_host?(participant_role) || admin_user?(user)

      {
        visible_to_roles:    block.visible_to_roles,
        visible_to_segments: block.visible_to_segment_names,
        target_user_ids:     block.target_user_ids,
        show_in_lobby:       block.show_in_lobby
      }
    end

    def dag_metadata(block, participant_role, user, depth)
      return {} unless mod_or_host?(participant_role) || admin_user?(user)

      metadata = {
        child_block_ids:  block.children.map(&:id),
        parent_block_ids: block.parents.map(&:id)
      }

      if depth == 0 && block.children.any?
        metadata[:children] = block.children.map do |child|
          serialize_block(child, participant_role: participant_role, user: user, depth: depth + 1)
        end
      end

      if block.kind == ExperienceBlock::MAD_LIB
        metadata[:variables]        = block.variables.map { |v| { id: v.id, key: v.key, label: v.label, datatype: v.datatype, required: v.required } }
        metadata[:variable_bindings] = block.variables.flat_map { |v| v.bindings.map { |b| { id: b.id, variable_id: b.variable_id, source_block_id: b.source_block_id } } }
      end

      metadata
    end

    # --- Experience serialization ---

    def experience_payload(blocks:, **extra)
      base_url     = Rails.application.config.app_base_url
      participants = @experience.experience_participants.includes(:user).to_a

      result = {
        id:               @experience.id,
        name:             @experience.name,
        code:             @experience.code,
        code_slug:        @experience.code_slug,
        url:              "#{base_url}/experiences/#{@experience.code_slug}",
        status:           @experience.status,
        description:      @experience.description,
        creator_id:       @experience.creator_id,
        created_at:       @experience.created_at,
        updated_at:       @experience.updated_at,
        blocks:           blocks,
        playbill_enabled: @experience.playbill_enabled,
        playbill:         serialize_playbill,
        segments:         serialize_segments,
        hosts:            serialize_participants(participants.select { |p| p.role == "host" }),
        participants:     serialize_participants(participants)
      }

      result.merge(extra)
    end

    def serialize_participants(participants)
      participants.map do |p|
        {
          id:            p.id,
          user_id:       p.user.id,
          experience_id: p.experience_id,
          name:          p.name,
          email:         p.user.email,
          status:        p.status,
          role:          p.role,
          segments:      p.segment_names,
          joined_at:     p.joined_at,
          fingerprint:   p.fingerprint,
          created_at:    p.created_at,
          updated_at:    p.updated_at
        }
      end
    end

    def serialize_segments
      @experience.experience_segments.order(position: :asc).map do |s|
        { id: s.id, name: s.name, color: s.color, position: s.position }
      end
    end

    def serialize_playbill
      return [] unless @experience.playbill.is_a?(Array)

      @experience.playbill.map do |section|
        resolved = section.dup
        if section["image_signed_id"].present?
          blob = ActiveStorage::Blob.find_signed(section["image_signed_id"])
          resolved["image_url"] = blob ? ActiveStorageUrlService.blob_url(blob) : nil
        end
        resolved
      end
    end

    # --- Helpers ---

    def format_poll_response(submission)
      return nil unless submission
      { id: submission.id, answer: { selectedOptions: Array(submission.answer["selectedOptions"]) } }
    end

    def calculate_poll_aggregate(submissions)
      submissions.each_with_object({}) do |s, agg|
        Array(s.answer["selectedOptions"]).each { |opt| agg[opt] = (agg[opt] || 0) + 1 }
      end
    end

    def submission_payload(submission)
      { id: submission.id, user_id: submission.user_id, answer: submission.answer, created_at: submission.created_at }
    end

    def attachment_url(attachment)
      attachment.attached? ? ActiveStorageUrlService.blob_url(attachment.blob) : nil
    end

    def host_or_moderator?(role)
      role.to_s.in?(%w[host moderator])
    end

    alias_method :mod_or_host?, :host_or_moderator?

    def admin_user?(user)
      user&.role.to_s.in?(%w[admin superadmin])
    end
  end
end
