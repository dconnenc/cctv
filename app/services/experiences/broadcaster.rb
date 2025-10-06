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

    broadcast_tv_view
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

  def self.tv_stream_key(experience)
    "experience_#{experience.id}_tv"
  end

  private

  def broadcast_tv_view
    begin
      send_broadcast(
        self.class.tv_stream_key(experience),
        WebsocketMessageService.experience_updated(
          experience,
          visibility_payload: Experiences::Visibility.payload_for_tv(
            experience: experience
          ),
          stream_key: "tv_view",
          stream_type: :tv,
          participant_id: nil,
          role: :host,
          segments: []
        )
      )
    rescue => e
      Rails.logger.error(
        "Error broadcasting to TV view: #{e.message}"
      )

      return
    end
  end

  def broadcast_to_participant(participant)
    begin
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
          segments: participant.segments || []
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
