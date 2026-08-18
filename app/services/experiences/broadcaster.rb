require 'digest'

class Experiences::Broadcaster
  attr_reader :experience

  def initialize(experience)
    @experience = experience
  end

  def self.profile_stream_key(experience, fingerprint)
    "experience_#{experience.id}_profile_#{fingerprint}"
  end

  def self.visibility_fingerprint(experience, participant, targeted_block_data: nil)
    segments     = participant.experience_segments.map(&:name).sort
    targeted_ids = if targeted_block_data
      user_id_str = participant.user_id.to_s
      targeted_block_data
        .select { |_, user_ids| user_ids.map(&:to_s).include?(user_id_str) }
        .map(&:first)
        .sort
    else
      experience.experience_blocks
        .where("? = ANY(target_user_ids)", participant.user_id)
        .order(:id).pluck(:id)
    end
    Digest::SHA1.hexdigest([participant.role, segments.join(","), targeted_ids.join(",")].join(":"))
  end

  def self.enqueue_update(experience)
    Experiences::BroadcastUpdateJob.perform_later(experience.id)
  end

  def broadcast_profile_changes(profile_changes:)
    Array(profile_changes).each do |change|
      broadcast_resubscribe_if_profile_changed(
        participant: change[:participant],
        old_fingerprint: change[:old_fingerprint]
      )
    end
  end

  def broadcast_experience_update
    Rails.logger.info(
      "[Broadcaster] Broadcasting to experience #{experience.code}"
    )

    targeted_block_data = experience.experience_blocks
      .where("target_user_ids IS NOT NULL AND cardinality(target_user_ids) > 0")
      .pluck(:id, :target_user_ids)

    visibility = Experiences::Visibility.new(experience)

    experience.experience_participants.includes(:user, :experience_segments)
      .group_by { |p| self.class.visibility_fingerprint(experience, p, targeted_block_data: targeted_block_data) }
      .each do |fingerprint, participants|
        rep = participants.first
        broadcast_to_profile(
          self.class.profile_stream_key(experience, fingerprint),
          role:       rep.role,
          segments:   rep.experience_segments.map(&:name),
          user_id:    rep.user_id,
          visibility: visibility
        )
      end

    broadcast_monitor_view(visibility: visibility)
    broadcast_admin_view(visibility: visibility)
  end

  def broadcast_balloon_pump_leader_update(block_id:, leader_fill:)
    Rails.logger.info(
      "[Broadcaster] Broadcasting balloon_pump_leader_updated to experience #{experience.code}"
    )
    message = WebsocketMessageService.minigame_balloon_pump_leader_updated(
      block_id: block_id,
      leader_fill: leader_fill
    )
    send_broadcast(self.class.admin_stream_key(experience), message)
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

    send_broadcast(self.class.admin_stream_key(experience), message)
  end

  def self.monitor_stream_key(experience)
    "experience_#{experience.id}_monitor"
  end

  def self.admin_stream_key(experience)
    "experience_#{experience.id}_admins"
  end

  private

  def broadcast_resubscribe_if_profile_changed(participant:, old_fingerprint:)
    participant.experience_segments.reload
    new_fingerprint = self.class.visibility_fingerprint(experience, participant)
    return if old_fingerprint == new_fingerprint

    old_stream = self.class.profile_stream_key(experience, old_fingerprint)
    send_broadcast(
      old_stream,
      WebsocketMessageService.resubscribe_required(participant_id: participant.id)
    )
  end

  def broadcast_monitor_view(visibility:)
    begin
      payload = visibility.for_monitor

      send_broadcast(
        self.class.monitor_stream_key(experience),
        WebsocketMessageService.experience_updated(
          payload,
          stream_key: "monitor_view",
          stream_type: :monitor,
          participant_id: nil,
          role: :host,
          segments: []
        )
      )
    rescue => e
      Rails.logger.error(
        "Error broadcasting to Monitor view: #{e.message}"
      )

      return
    end
  end

  def broadcast_admin_view(visibility:)
    begin
      payload = visibility.for_admin

      send_broadcast(
        self.class.admin_stream_key(experience),
        WebsocketMessageService.experience_updated(
          payload,
          stream_key: "admin_view",
          stream_type: :admin,
          participant_id: nil,
          role: :host,
          segments: []
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

  def broadcast_to_profile(stream_key, role:, segments:, user_id: nil, visibility:)
    begin
      payload = visibility.for_profile(role: role, segments: segments, user_id: user_id)

      send_broadcast(
        stream_key,
        WebsocketMessageService.experience_updated(
          payload,
          stream_key: stream_key,
          stream_type: :profile,
          participant_id: nil,
          role: role.to_sym,
          segments: segments
        )
      )
    rescue => e
      Rails.logger.error(
        "Error broadcasting to profile #{stream_key}: #{e.message}"
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
