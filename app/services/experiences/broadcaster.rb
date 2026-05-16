require 'digest'

class Experiences::Broadcaster
  attr_reader :experience

  def initialize(experience)
    @experience = experience
  end

  def self.profile_stream_key(experience, fingerprint)
    "experience_#{experience.id}_profile_#{fingerprint}"
  end

  def self.visibility_fingerprint(experience, participant)
    segments     = participant.experience_segments.map(&:name).sort
    targeted_ids = experience.experience_blocks
      .where("? = ANY(target_user_ids)", participant.user_id)
      .order(:id).pluck(:id)
    Digest::SHA1.hexdigest([participant.role, segments.join(","), targeted_ids.join(",")].join(":"))
  end

  def broadcast_experience_update(profile_changes: [])
    Array(profile_changes).each do |change|
      broadcast_resubscribe_if_profile_changed(
        participant: change[:participant],
        old_fingerprint: change[:old_fingerprint]
      )
    end

    Rails.logger.info(
      "[Broadcaster] Broadcasting to experience #{experience.code}"
    )

    experience.experience_participants.includes(:user, :experience_segments)
      .group_by { |p| self.class.visibility_fingerprint(experience, p) }
      .each do |fingerprint, participants|
        rep = participants.first
        broadcast_to_profile(
          self.class.profile_stream_key(experience, fingerprint),
          role:     rep.role,
          segments: rep.experience_segments.map(&:name),
          user_id:  rep.user_id
        )
      end

    broadcast_monitor_view
    broadcast_admin_view
  end

  # Lightweight monitor-only broadcast for balloon pump leader updates.
  # Server-side throttle: only broadcasts if MIN_BROADCAST_INTERVAL_MS has
  # elapsed since the last broadcast for this block.
  MIN_BALLOON_BROADCAST_INTERVAL_MS = 150

  def broadcast_balloon_pump_leader_update(block:)
    payload      = block.payload || {}
    last_at_iso  = payload["leader_last_broadcast_at"]
    now          = Time.current

    if last_at_iso.present?
      last_at = Time.iso8601(last_at_iso) rescue nil
      if last_at && ((now - last_at) * 1000.0) < MIN_BALLOON_BROADCAST_INTERVAL_MS
        return
      end
    end

    block.update_columns(
      payload: payload.merge("leader_last_broadcast_at" => now.iso8601),
      updated_at: now
    )

    message = WebsocketMessageService.balloon_pump_leader_updated(
      block_id: block.id,
      leader_fill: payload["leader_fill"].to_i,
      target_units: payload["target_units"].to_i,
      leader_participant_id: payload["leader_participant_id"]
    )

    send_broadcast(self.class.monitor_stream_key(experience), message)
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

  def broadcast_monitor_view
    begin
      payload = Experiences::Visibility.for_monitor(experience)

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

  def broadcast_admin_view
    begin
      payload = Experiences::Visibility.for_admin(experience)

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

  def broadcast_to_profile(stream_key, role:, segments:, user_id: nil)
    begin
      payload = Experiences::Visibility.for_profile(experience, role: role, segments: segments, user_id: user_id)

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
