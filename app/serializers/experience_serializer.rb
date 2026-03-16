class ExperienceSerializer
  def self.serialize_experience(
    experience,
    visibility_payload: nil,
    include_participants: false,
    participants: nil
  )
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

  def self.serialize_for_api_response(
    experience,
    visibility_payload:,
    current_participant: nil,
    participants: nil
  )
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

  def self.serialize_for_websocket_message(
    experience,
    visibility_payload:,
    include_participants: false,
    participants: nil
  )
    serialize_experience(
      experience,
      visibility_payload: visibility_payload,
      include_participants: include_participants,
      participants: participants
    )
  end

  def self.for_admin(experience:, blocks: nil, submissions_cache: nil)
    new(experience: experience, blocks: blocks, submissions_cache: submissions_cache).for_admin
  end

  def self.for_monitor(experience:, blocks: nil, participants: nil, submissions_cache: nil)
    new(experience: experience, blocks: blocks, participants: participants, submissions_cache: submissions_cache).for_monitor
  end

  def self.for_participant(experience:, user:, participant: nil, blocks: nil, submissions_cache: nil, participants_by_user_id: nil)
    new(
      experience: experience,
      user: user,
      participant: participant,
      blocks: blocks,
      submissions_cache: submissions_cache,
      participants_by_user_id: participants_by_user_id
    ).for_participant
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

  def initialize(experience:, user: nil, participant: nil, blocks: nil, participants: nil, submissions_cache: nil, participants_by_user_id: nil)
    @experience = experience
    @user = user
    @participant = participant
    @blocks = blocks
    @participants = participants
    @submissions_cache = submissions_cache
    @participants_by_user_id = participants_by_user_id
  end

  def for_admin
    visible = Experiences::Visibility.admin_visible_blocks(@experience, blocks: @blocks)
    current_block = Experiences::Visibility.resolve_block_for_admin(visible)
    next_block = current_block ? Experiences::Visibility.resolve_block_for_admin(visible.reject { |b| b == current_block }) : nil

    {
      experience: {
        blocks: visible.map { |b| BlockSerializer.serialize_for_stream(b, participant_role: "host", submissions_cache: @submissions_cache) },
        next_block: next_block ? BlockSerializer.serialize_for_stream(next_block, participant_role: "host", submissions_cache: @submissions_cache) : nil
      }
    }
  end

  def for_monitor
    visible = Experiences::Visibility.monitor_visible_blocks(@experience, blocks: @blocks)
    current_block = visible.first
    next_block = visible.second

    {
      experience: {
        blocks: current_block ? [serialize_monitor_block(current_block)] : [],
        next_block: next_block ? serialize_monitor_block(next_block) : nil,
        participant_block_active: participant_block_active?,
        responded_participant_ids: responded_participant_ids
      }
    }
  end

  def for_participant
    participant_record = @participant ||
      @participants_by_user_id&.dig(@user.id) ||
      @experience.experience_participants.find_by(user_id: @user.id)

    if participant_record.blank? && !(@user.admin? || @user.superadmin?)
      return { experience: { blocks: [], next_block: nil } }
    end

    visibility = Experiences::Visibility.new(
      experience: @experience,
      user_role: @user.role,
      participant_role: participant_record&.role,
      segments: participant_record&.segment_names || [],
      target_user_ids: [@user.id],
      preloaded_blocks: @blocks,
      submissions_cache: @submissions_cache,
      participant: participant_record,
      participants_by_user_id: @participants_by_user_id
    )

    effective_role = participant_record&.role || "host"

    if visibility.moderator_or_host? || visibility.user_admin?
      serialized_blocks = visibility.visible_blocks.map do |block|
        BlockSerializer.serialize_for_user(block, participant_role: effective_role, user: @user, submissions_cache: @submissions_cache)
      end
      next_block = visibility.next_block_for_user
    else
      resolved = visibility.resolve_block_for_user
      serialized_blocks = resolved ? [BlockSerializer.serialize_for_user(resolved, participant_role: effective_role, user: @user, submissions_cache: @submissions_cache)] : []
      next_block = visibility.next_block_for_user
    end

    {
      experience: {
        blocks: serialized_blocks,
        next_block: next_block ? BlockSerializer.serialize_for_user(next_block, participant_role: effective_role, user: @user, submissions_cache: @submissions_cache) : nil
      }
    }
  end

  private

  def serialize_monitor_block(block)
    serialized = BlockSerializer.serialize_for_stream(block, participant_role: "host", submissions_cache: @submissions_cache)

    if block.kind == ExperienceBlock::MAD_LIB
      participant_list = @participants || @experience.experience_participants
      all_resolved_variables = participant_list.each_with_object({}) do |participant, vars|
        vars.merge!(Experiences::BlockResolver.resolve_variables(block: block, participant: participant, submissions_cache: @submissions_cache))
      end
      serialized[:responses][:resolved_variables] = all_resolved_variables
    end

    serialized
  end

  def responded_participant_ids
    all_blocks = @blocks || @experience.experience_blocks.to_a
    participant_list = @participants || @experience.experience_participants.to_a

    active_blocks = all_blocks.select do |block|
      block.parent_block_id.nil? &&
        block.status == "open" &&
        block.visible_to_roles.empty? &&
        block.target_user_ids.empty? &&
        !block.experience_segments.any?
    end

    return [] if active_blocks.empty?

    responded_user_ids = Set.new

    if @submissions_cache
      active_blocks.each do |block|
        (@submissions_cache[block.id] || {}).each_key { |uid| responded_user_ids.add(uid) }
        all_blocks.select { |b| b.parent_block_id == block.id }.each do |child|
          (@submissions_cache[child.id] || {}).each_key { |uid| responded_user_ids.add(uid) }
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

  def participant_block_active?
    if @blocks
      @blocks.any? do |block|
        block.parent_block_id.nil? &&
          block.status == "open" &&
          block.visible_to_roles.empty? &&
          block.target_user_ids.empty? &&
          !block.experience_segments.any? &&
          block.payload["show_on_monitor"] == false
      end
    else
      @experience.parent_blocks
        .where(status: "open")
        .where(visible_to_roles: [], target_user_ids: [])
        .where.missing(:experience_block_segments)
        .any? { |b| b.payload["show_on_monitor"] == false }
    end
  end
end
