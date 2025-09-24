class Experiences::Broadcaster
  def initialize(experience)
    @experience = experience
    @stream_key_generator = Experiences::StreamKeyGenerator.new(experience)
  end

  def broadcast_experience_update
    streams = @stream_key_generator.generate_stream_keys
    participant_mapping = @stream_key_generator.participant_to_stream_mapping

    Rails.logger.info(
      "[Broadcaster] Broadcasting to experience #{@experience.code}: " \
        "#{participant_mapping.count} participants → #{streams.count} distinct streams"
    )

    participants_by_stream = group_participants_by_stream(participant_mapping)

    # Note: this is the bottleneck for the current implementation. We aren't
    # bufferring/deduping broadcasts, and we're not doing bulk stream updates.
    #
    # This will need to be enhanced in order for this approach to scale
    participants_by_stream.each do |stream_key, participants|
      if Rails.logger.debug?
        Rails.logger.debug(
          "[Broadcaster] Broadcasting to #{participants.count} participants on " \
            "stream #{stream_key}"
        )
      end

      broadcast_to_stream(stream_key, streams[stream_key], participants)
    end
  end

  # Trigger resubscription for participants whose segments changed
  #
  # Usage: Call this whenever a participant's segments are updated
  # Example:
  #   participant.update!(segments: ['vip', 'premium'])
  #   Experiences::Broadcaster.trigger_resubscription_for_participant(participant)
  #
  # Multi-segment compatibility:
  # - For participants with multiple segments ['vip', 'premium'], the system creates
  #   composite streams that provide access to blocks from ALL their segments
  # - Resubscription handles segment reordering, additions, and removals correctly
  # - Stream assignment is deterministic based on sorted segment combinations
  #
  # This will:
  # 1. Send a message to the participant's current stream
  # 2. Frontend receives 'resubscribe_required' message
  # 3. Frontend calls resubscribe action on ActionCable
  # 4. ActionCable channel determines new optimal stream and switches subscription
  def self.trigger_resubscription_for_participant(participant)
    Rails.logger.info(
      "[Broadcaster] Triggering resubscription for participant " \
        "#{participant.id} in experience #{participant.experience.code}"
    )

    stream_key_generator = Experiences::StreamKeyGenerator
      .new(participant.experience)
    action_cable_stream = stream_key_generator
      .action_cable_stream_key_for_participant(participant)

    message = WebsocketMessageService.resubscribe_required(
      participant_id: participant.id,
      reason: 'segments_changed'
    )

    ActionCable.server.broadcast(action_cable_stream, message)
  end

  private

  def group_participants_by_stream(participant_mapping)
    grouped = {}

    participant_mapping.each do |participant_id, mapping_data|
      stream_key = mapping_data[:logical_stream_key]
      grouped[stream_key] ||= []
      grouped[stream_key] << mapping_data[:participant]
    end

    grouped
  end

  def broadcast_to_stream(stream_key, stream_data, participants)
    begin
      visibility = Experiences::StreamVisibility.new(
        experience: @experience,
        role: stream_data[:role],
        segments: stream_data[:segments] || [],
        target_user_ids: stream_data[:target_user_ids] || []
      )
      visibility_payload = visibility.payload
    rescue => e
      # Log error but don't fail the entire broadcast
      Rails.logger.error(
        "Error generating visibility for stream #{stream_key}: #{e.message}"
      )

      return
    end

    participants.each do |participant|
      broadcast_to_participant(participant, visibility_payload, stream_key, stream_data)
    end
  end

  def broadcast_to_participant(participant, visibility_payload, stream_key, stream_data)
    participant_stream_key = @stream_key_generator
      .action_cable_stream_key_for_participant(participant)

    message = WebsocketMessageService.experience_updated(
      @experience,
      visibility_payload: visibility_payload,
      stream_key: stream_key,
      stream_type: stream_data[:type],
      participant_id: participant.id,
      role: stream_data[:role],
      segments: stream_data[:segments] || []
    )

    send_broadcast(participant_stream_key, message)
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

  private

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
