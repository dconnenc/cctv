class ExperienceSerializer
  def self.serialize_experience(experience, visibility_payload: nil, include_participants: false)
    blocks = visibility_payload&.dig(:experience, :blocks) || []

    result = {
      id: experience.id,
      name: experience.name,
      code: experience.code,
      code_slug: experience.code_slug,
      status: experience.status,
      description: experience.description,
      creator_id: experience.creator_id,
      created_at: experience.created_at,
      updated_at: experience.updated_at,
      blocks: blocks
    }

    if include_participants
      result[:hosts] = serialize_participants(experience.experience_participants.host)
      result[:participants] = serialize_participants(experience.experience_participants)
    end

    result
  end

  def self.serialize_for_api_response(experience, visibility_payload:, current_participant: nil)
    {
      type: 'success',
      success: true,
      experience: serialize_experience(experience, visibility_payload: visibility_payload, include_participants: true),
      participant: current_participant ? serialize_participant_summary(current_participant) : nil
    }
  end

  def self.serialize_for_websocket_message(experience, visibility_payload:, include_participants: false)
    serialize_experience(experience, visibility_payload: visibility_payload, include_participants: include_participants)
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
end
