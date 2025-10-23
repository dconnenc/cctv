# frozen_string_literal: true

class WebsocketMessageService
  # WebSocket message type constants
  MESSAGE_TYPES = {
    # Experience updates
    EXPERIENCE_STATE: 'experience_state',
    EXPERIENCE_UPDATED: 'experience_updated', 
    STREAM_CHANGED: 'stream_changed',
    
    # Subscription management
    RESUBSCRIBE_REQUIRED: 'resubscribe_required',
    
    # ActionCable built-ins
    CONFIRM_SUBSCRIPTION: 'confirm_subscription',
    PING: 'ping'
  }.freeze

  # Build experience state message (initial subscription)
  def self.experience_state(experience, visibility_payload:, logical_stream:, participant_id:, participant: nil, include_participants: false)
    message = {
      type: MESSAGE_TYPES[:EXPERIENCE_STATE],
      experience: ExperienceSerializer.serialize_for_websocket_message(
        experience,
        visibility_payload: visibility_payload,
        include_participants: include_participants
      ),
      metadata: {
        logical_stream: logical_stream,
        participant_id: participant_id,
        timestamp: Time.current.to_f
      }
    }
    
    message[:participant] = participant if participant
    message
  end

  # Build experience updated message (broadcasts)
  def self.experience_updated(experience, visibility_payload:, stream_key:, stream_type:, participant_id:, role:, segments:, participant: nil, include_participants: false)
    message = {
      type: MESSAGE_TYPES[:EXPERIENCE_UPDATED],
      experience: ExperienceSerializer.serialize_for_websocket_message(
        experience,
        visibility_payload: visibility_payload,
        include_participants: include_participants
      ),
      metadata: {
        stream_key: stream_key,
        stream_type: stream_type,
        participant_id: participant_id,
        role: role,
        segments: segments,
        timestamp: Time.current.to_f
      }
    }
    
    message[:participant] = participant if participant
    message
  end

  # Build stream changed message (resubscription complete)
  def self.stream_changed(experience, visibility_payload:, old_stream:, new_stream:, participant_id:, participant: nil, include_participants: false)
    message = {
      type: MESSAGE_TYPES[:STREAM_CHANGED],
      experience: ExperienceSerializer.serialize_for_websocket_message(
        experience,
        visibility_payload: visibility_payload,
        include_participants: include_participants
      ),
      metadata: {
        old_stream: old_stream,
        new_stream: new_stream,
        participant_id: participant_id,
        timestamp: Time.current.to_f
      }
    }
    
    message[:participant] = participant if participant
    message
  end

  # Build resubscribe required message (trigger client resubscription)
  def self.resubscribe_required(participant_id:, reason: 'segments_changed')
    {
      type: MESSAGE_TYPES[:RESUBSCRIBE_REQUIRED],
      reason: reason,
      participant_id: participant_id,
      timestamp: Time.current.to_f
    }
  end

  # Validate message type
  def self.valid_message_type?(type)
    MESSAGE_TYPES.value?(type)
  end

  # Get all message types for frontend type generation
  def self.message_types
    MESSAGE_TYPES
  end
end