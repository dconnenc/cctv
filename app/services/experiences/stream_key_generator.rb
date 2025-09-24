class Experiences::StreamKeyGenerator
  def initialize(experience)
    @experience = experience
  end

  def generate_stream_keys
    stream_keys = {}

    participating_roles.each do |role|
      key = build_role_stream_key(role)
      stream_keys[key] = {
        type: :role,
        role: role,
        segments: [],
        target_user_ids: []
      }
    end

    unique_segment_combinations.each do |segments|
      participating_roles.each do |role|
        key = build_role_segments_stream_key(role, segments)
        stream_keys[key] = {
          type: :role_segments,
          role: role,
          segments: segments,
          target_user_ids: []
        }
      end
    end

    user_ids_targeted_in_blocks.each do |user_id|
      user = User.find(user_id)
      participant = @experience.experience_participants.find_by(user: user)
      next unless participant

      key = build_user_stream_key(user_id)
      stream_keys[key] = {
        type: :targeted,
        role: participant.role.to_sym,
        segments: participant.segments || [],
        target_user_ids: [user_id]
      }
    end

    stream_keys
  end

  def stream_key_for_participant(participant)
    available_keys = generate_stream_keys.keys

    user_id = participant.user_id
    role = participant.role.to_sym
    segments = participant.segments || []

    # Highest priority: Individual targeting
    targeted_key = build_user_stream_key(user_id)
    return targeted_key if available_keys.include?(targeted_key)

    # Next priority: Role + segments combination (use only active segments)
    # For participants with segments, use composite key that includes only
    # segments used in blocks
    if segments.any?
      active_segments = segments & segments_used_in_blocks
      if active_segments.any?
        segments_key = build_role_segments_stream_key(role, active_segments.sort)
        return segments_key if available_keys.include?(segments_key)
      end
    end

    # Default: Role-based stream
    role_key = build_role_stream_key(role)
    return role_key if available_keys.include?(role_key)

    # Fallback (shouldn't happen with valid data)
    build_role_stream_key(role)
  end

  def action_cable_stream_key_for_participant(participant)
    "experience_#{@experience.id}_participant_#{participant.id}"
  end

  def build_role_stream_key(role)
    "role:#{role}"
  end

  def build_role_segments_stream_key(role, segments)
    if segments.empty?
      build_role_stream_key(role)
    elsif segments.size == 1
      "role:#{role}:segment:#{segments.first}"
    else
      sorted_segments = segments.sort.join('+')
      "role:#{role}:segments:#{sorted_segments}"
    end
  end

  def build_user_stream_key(user_id)
    "user:#{user_id}"
  end

  def participant_to_stream_mapping
    stream_keys = generate_stream_keys
    mapping = {}

    @experience.experience_participants.includes(:user).each do |participant|
      stream_key = stream_key_for_participant(participant)
      action_cable_key = action_cable_stream_key_for_participant(participant)

      mapping[participant.id] = {
        participant: participant,
        logical_stream_key: stream_key,
        action_cable_stream_key: action_cable_key,
        stream_data: stream_keys[stream_key]
      }
    end

    mapping
  end

  private

  def participating_roles
    @participating_roles ||= @experience
      .experience_participants
      .distinct
      .pluck(:role)
      .map(&:to_sym)
  end

  # TODO: Move this to sql
  def segments_used_in_blocks
    @segments_used_in_blocks ||= begin
      segments = []
      @experience.experience_blocks.each do |block|
        if block.visible_to_segments.present?
          segments.concat(block.visible_to_segments)
        end
      end
      segments.uniq
    end
  end

  def unique_segment_combinations
    @unique_segment_combinations ||= begin
      combinations = Set.new

      # Add individual segments that are used in blocks
      segments_used_in_blocks.each do |segment|
        combinations.add([segment])
      end

      # Add multi-segment combinations that actually exist among participants
      @experience.experience_participants.includes(:user).each do |participant|
        participant_segments = participant.segments || []
        if participant_segments.any?

          # Only include segments that are actually used in blocks
          active_segments = participant_segments & segments_used_in_blocks
          if active_segments.any?
            combinations.add(active_segments.sort)
          end
        end
      end

      combinations.to_a
    end
  end

  def user_ids_targeted_in_blocks
    @user_ids_targeted_in_blocks ||= begin
      user_ids = []
      @experience.experience_blocks.each do |block|
        if block.target_user_ids.present?
          user_ids.concat(block.target_user_ids)
        end
      end
      user_ids.uniq
    end
  end
end
