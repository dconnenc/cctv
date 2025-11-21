class Experiences::Broadcaster
  attr_reader :experience

  def initialize(experience)
    @experience = experience
  end

  def self.stream_key_for_participant(participant)
    "experience_#{participant.experience_id}_participant_#{participant.id}"
  end

  def broadcast_experience_update
    Rails.logger.info(
      "[Broadcaster] Broadcasting to experience #{experience.code}"
    )

    experience.experience_participants.includes(:user).each do |participant|
      broadcast_to_participant(participant)
    end

    broadcast_monitor_view
    broadcast_admin_view
  end

  def broadcast_family_feud_update(block_id:, operation:, data:)
    Rails.logger.info(
      "[Broadcaster] Broadcasting family_feud_updated to experience #{experience.code}"
    )

    message = WebsocketMessageService.family_feud_updated(
      block_id: block_id,
      operation: operation,
      data: data
    )

    # Broadcast to admin stream (hosts/moderators managing the experience)
    send_broadcast(self.class.admin_stream_key(experience), message)
    
    # Note: We only broadcast to admin stream since bucket configuration
    # is an admin-only feature. Participants don't need these updates.
  end

  def self.trigger_resubscription_for_participant(participant)
    Rails.logger.info(
      "[Broadcaster] Triggering resubscription for participant " \
        "#{participant.id} in experience #{participant.experience.code}"
    )

    ActionCable.server.broadcast(
      stream_key_for_participant(participant),
      WebsocketMessageService.resubscribe_required(
        participant_id: participant.id,
        reason: 'segments_changed'
      )
    )
  end

  def self.monitor_stream_key(experience)
    "experience_#{experience.id}_monitor"
  end

  def self.admin_stream_key(experience)
    "experience_#{experience.id}_admins"
  end

  private

  def broadcast_monitor_view
    begin
      send_broadcast(
        self.class.monitor_stream_key(experience),
        WebsocketMessageService.experience_updated(
          experience,
          visibility_payload: Experiences::Visibility.payload_for_monitor(
            experience: experience
          ),
          stream_key: "monitor_view",
          stream_type: :monitor,
          participant_id: nil,
          role: :host,
          segments: [],
          include_participants: true
        )
      )
    rescue => e
      Rails.logger.error(
        "Error broadcasting to Monitor view: #{e.message}"
      )

      return
    end
  end

  def broadcast_admin_view
    begin
      send_broadcast(
        self.class.admin_stream_key(experience),
        WebsocketMessageService.experience_updated(
          experience,
          visibility_payload: Experiences::Visibility.payload_for_admin(
            experience: experience
          ),
          stream_key: "admin_view",
          stream_type: :admin,
          participant_id: nil,
          role: :host,
          segments: [],
          include_participants: true
        )
      )
    rescue => e
      Rails.logger.error(
        "Error broadcasting to admin view: #{e.message}"
      )
      Rails.logger.error(
        "[Broadcaster] Backtrace: #{e.backtrace.first(3).join(', ')}"
      )

      return
    end
  end

  def broadcast_to_participant(participant)
    begin
      participant_summary = {
        id: participant.id,
        user_id: participant.user_id,
        name: participant.name,
        email: participant.user.email,
        role: participant.role
      }

      send_broadcast(
        self.class.stream_key_for_participant(participant),
        WebsocketMessageService.experience_updated(
          experience,
          visibility_payload: Experiences::Visibility.payload_for_user(
            experience: experience,
            user: participant.user
          ),
          stream_key: "participant_#{participant.id}",
          stream_type: :direct,
          participant_id: participant.id,
          role: participant.role.to_sym,
          segments: participant.segments || [],
          participant: participant_summary,
          include_participants: true
        )
      )
    rescue => e
      # Log error but don't fail the entire broadcast
      Rails.logger.error(
        "Error broadcasting to participant #{participant.id}: #{e.message}"
      )

      return
    end

  end

  def send_broadcast(stream_key, message)
    Rails.logger.info(
      "[Broadcaster] Broadcasting to stream #{stream_key}: #{message[:type]}"
    )

    ActionCable.server.broadcast(stream_key, message)
  rescue => e
    Rails.logger.error(
      "[Broadcaster] Failed to broadcast to #{stream_key}: #{e.message}"
    )

    Rails.logger.error(
      "[Broadcaster] Backtrace: #{e.backtrace.first(3).join(', ')}"
    )

    raise
  end
end
