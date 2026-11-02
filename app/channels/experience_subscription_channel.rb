class ExperienceSubscriptionChannel < ApplicationCable::Channel
  def subscribed
    setup_experience_and_user
    return unless @experience

    if monitor_view_subscription?
      setup_monitor_view_subscription
    else
      unless @is_admin || @participant
        reject
        return
      end
      setup_stream_subscription
    end

    send_initial_experience_state
    log_successful_subscription
  end

  def unsubscribed
    log_unsubscription
  end

  # Live drawing events from participants during lobby
  def drawing_event(data)
    return unless @experience && @participant && !monitor_view_subscription? && !@is_admin

    op = data["operation"]
    payload = data["data"] || {}

    case op
    when 'stroke_started'
      points = payload['points']
      return unless points.is_a?(Array)
      @current_stroke = {
        'points' => points,
        'color' => payload['color'],
        'width' => payload['width'],
      }
    when 'stroke_points_appended'
      extra = payload['points']
      return unless extra.is_a?(Array)
      @current_stroke ||= { 'points' => [], 'color' => nil, 'width' => nil }
      @current_stroke['points'] = (@current_stroke['points'] || []).concat(extra)
    when 'stroke_ended'
      if @current_stroke
        points = @current_stroke['points'] || []
        if points.length == 2
          @current_stroke['points'] = points + points
        end
        @participant.reload
        avatar = (@participant.avatar || {}).dup
        strokes = (avatar['strokes'] || []) + [@current_stroke]
        @participant.update!(avatar: avatar.merge('strokes' => strokes))
        @current_stroke = nil
      end
    when 'stroke_undone'
      @current_stroke = nil
      @participant.reload
      avatar = (@participant.avatar || {}).dup
      strokes = avatar['strokes'] || []
      if strokes.any?
        strokes = strokes[0...-1]
        @participant.update!(avatar: avatar.merge('strokes' => strokes))
      end
    when 'canvas_clear_undone'
      @current_stroke = nil
      raw = payload['strokes']
      valid_strokes = raw.is_a?(Array) ? raw.select { |s| s.is_a?(Hash) && s['points'].is_a?(Array) } : []
      @participant.update!(avatar: { 'strokes' => valid_strokes })
    when 'canvas_cleared'
      @current_stroke = nil
      @participant.update!(avatar: {})
    end

    ActionCable.server.broadcast(
      Experiences::Broadcaster.monitor_stream_key(@experience),
      {
        type: 'drawing_update',
        participant_id: @participant.id,
        operation: op,
        data: payload,
      },
    )
  end

  # Fishy steering. Phones send only when their direction changes; this writes
  # straight to Redis for the tick loop — no DB write, no broadcast.
  def fishy_input(data)
    slot = fishy_slot(data)
    return unless slot

    store     = Minigames::Fishy::Store.new(data["block_id"], data["started_at"])
    direction = fishy_direction(data)
    direction ? store.set_input(slot, *direction) : store.clear_input(slot)
  end

  def fishy_dash(data)
    slot = fishy_slot(data)
    return unless slot

    direction = fishy_direction(data) || [0.0, 0.0]
    Minigames::Fishy::Store.new(data["block_id"], data["started_at"]).queue_dash(slot, *direction)
  end

  def resubscribe
    return reject unless valid_resubscription_request?

    log_resubscription_request
    reload_participant_data
    send_updated_experience_state
    log_successful_resubscription
  end

  private

  def setup_experience_and_user
    @experience = find_experience_or_reject
    @user, @is_admin = authenticate_user_or_reject
    @participant = find_participant_record_or_reject

    Rails.logger.info(
      "[ExperienceChannel] Setup complete: user=#{@user&.id}, " \
      "is_admin=#{@is_admin}, participant=#{@participant&.id}, " \
      "participant_role=#{@participant&.role}"
    )
  end

  def monitor_view_subscription?
    params[:view_type] == 'monitor'
  end

  def setup_monitor_view_subscription
    @current_stream = Experiences::Broadcaster.monitor_stream_key(@experience)
    @view_type = 'monitor'
    stream_from @current_stream
    stream_from Experiences::Broadcaster.live_stream_key(@experience)
    log_stream_subscription
  end

  def setup_stream_subscription
    # Route to admin stream if:
    # 1. System admin (admin JWT), OR
    # 2. Experience host/moderator (participant JWT with host/moderator role)
    is_manager = (@is_admin && !@participant) || is_host_or_moderator?

    Rails.logger.info(
      "[ExperienceChannel] Stream routing: is_admin=#{@is_admin}, " \
      "participant=#{@participant&.id}, is_host_or_mod=#{is_host_or_moderator?}, " \
      "routing_to_admin_stream=#{is_manager}"
    )

    if is_manager
      @current_stream = Experiences::Broadcaster.admin_stream_key(@experience)
      @view_type = 'admin'
      Rails.logger.info("[ExperienceChannel] Routed to admin stream: #{@current_stream}")
    else
      fingerprint = Experiences::Broadcaster.visibility_fingerprint(
        @experience, @participant
      )
      @current_stream = Experiences::Broadcaster.profile_stream_key(@experience, fingerprint)
      @view_type = 'participant'
      Rails.logger.info("[ExperienceChannel] Routed to participant stream: #{@current_stream}")
      stream_from Experiences::Broadcaster.live_stream_key(@experience)
    end
    stream_from @current_stream
    log_stream_subscription
  end

  def is_host_or_moderator?
    result = @participant&.role == 'host' || @participant&.role == 'moderator'
    Rails.logger.info(
      "[ExperienceChannel] is_host_or_moderator? participant_role=#{@participant&.role}, result=#{result}"
    )
    result
  end

  def send_initial_experience_state
    Rails.logger.info(
      "[ExperienceChannel] send_initial_experience_state: view_type=#{@view_type}, " \
      "user=#{@user&.id}, participant=#{@participant&.id}, is_admin=#{@is_admin}"
    )

    case @view_type
    when 'monitor'
      transmit(
        WebsocketMessageService.experience_state(
          Experiences::Visibility.for_monitor(@experience),
          logical_stream: "monitor_view",
          participant_id: nil
        )
      )

      avatars = @experience.experience_participants.includes(:user).filter_map do |p|
        next unless p.avatar.present?

        data =
          if p.avatar['image'].present?
            { image: p.avatar['image'], cosmetics: p.avatar['cosmetics'] || [] }
          elsif p.avatar['strokes'].present?
            { strokes: p.avatar['strokes'] }
          end
        next unless data

        { participant_id: p.id, operation: 'avatar_committed', data: data }
      end
      transmit(WebsocketMessageService.avatars_state(avatars)) unless avatars.empty?
      transmit_fishy_keyframes
    when 'admin'
      Rails.logger.info("[ExperienceChannel] Sending admin initial state")
      transmit(
        WebsocketMessageService.experience_state(
          Experiences::Visibility.for_admin(@experience),
          logical_stream: "admin_view",
          participant_id: nil
        )
      )

      @experience.experience_blocks
        .where(kind: ExperienceBlock::MINIGAME_BALLOON_PUMP)
        .each do |b|
          payload = b.payload || {}
          next unless payload["started_at"].present? && payload["ended_at"].blank?
          transmit(WebsocketMessageService.minigame_balloon_pump_leader_updated(
            block_id: b.id,
            leader_fill: payload["leader_fill"].to_i
          ))
        end
    else
      # Regular participant stream
      Rails.logger.info(
        "[ExperienceChannel] Sending participant initial state: " \
        "participant_id=#{@participant.id}, user_id=#{@user.id}"
      )

      participant_summary = {
        id: @participant.id.to_s,
        user_id: @participant.user_id.to_s,
        name: @participant.name,
        email: @participant.user.email,
        role: @participant.role,
        avatar: @participant.avatar.presence
      }

      transmit(
        WebsocketMessageService.experience_state(
          Experiences::Visibility.for_participant(@experience, @participant),
          logical_stream: "participant_#{@participant.id}",
          participant_id: @participant.id,
          participant: participant_summary
        )
      )
      transmit(WebsocketMessageService.submission_state(build_client_state(@participant)))
      transmit_fishy_keyframes
    end
  end

  # Running Fishy games stream deltas, so a fresh subscriber needs the full
  # world before the next keyframe.
  def transmit_fishy_keyframes
    @experience.experience_blocks.where(kind: ExperienceBlock::MINIGAME_FISHY).each do |block|
      payload = block.payload || {}
      next unless payload["started_at"].present? && payload["ended_at"].blank?

      state = Minigames::Fishy::Store.for(block).read_state
      next unless state

      transmit(WebsocketMessageService.minigame_fishy_frame(
        block_id: block.id,
        started_at: payload["started_at"],
        frame: Minigames::Fishy::Simulation.new(state).keyframe
      ))
    end
  end

  # The sender's roster slot for a running game, memoized per game so steering
  # at 10Hz doesn't query Postgres. nil for spectators, staff, and stale games.
  def fishy_slot(data)
    return unless @participant && !monitor_view_subscription? && !@is_admin

    key = [data["block_id"].to_s, data["started_at"].to_s]
    @fishy_slots ||= {}
    return @fishy_slots[key] if @fishy_slots.key?(key)

    block   = @experience.experience_blocks.find_by(id: key[0], kind: ExperienceBlock::MINIGAME_FISHY)
    payload = block&.payload || {}
    running = payload["started_at"].present? && payload["started_at"] == key[1] && payload["ended_at"].blank?

    @fishy_slots[key] = running ? Array(payload["roster"]).index(@participant.id.to_s) : nil
  end

  # A unit vector from client-supplied components, or nil for "no direction".
  def fishy_direction(data)
    dx = Float(data["dx"], exception: false)
    dy = Float(data["dy"], exception: false)
    return unless dx&.finite? && dy&.finite?

    magnitude = Math.hypot(dx, dy)
    return if magnitude < 1e-6

    [(dx / magnitude).round(4), (dy / magnitude).round(4)]
  end

  def valid_resubscription_request?
    @participant && @experience
  end

  def reload_participant_data
    @participant.reload
  end

  def send_updated_experience_state
    participant_summary = {
      id: @participant.id.to_s,
      user_id: @participant.user_id.to_s,
      name: @participant.name,
      email: @participant.user.email,
      role: @participant.role,
      avatar: @participant.avatar.presence
    }

    transmit(
      WebsocketMessageService.experience_state(
        Experiences::Visibility.for_participant(@experience, @participant),
        logical_stream: "participant_#{@participant.id}",
        participant_id: @participant.id,
        participant: participant_summary
      )
    )
    transmit(WebsocketMessageService.submission_state(build_client_state(@participant)))
  end

  def build_client_state(participant)
    result = {}
    block_scope = @experience.experience_blocks.select(:id)

    ExperienceQuestionSubmission
      .where(experience_block_id: block_scope, experience_participant_id: participant.id)
      .each { |s| result[s.experience_block_id.to_s] = { id: s.id, answer: s.answer } }

    ExperiencePollSubmission
      .where(experience_block_id: block_scope, experience_participant_id: participant.id)
      .each { |s| result[s.experience_block_id.to_s] = { id: s.id, answer: s.answer } }

    ExperienceBuzzerSubmission
      .where(experience_block_id: block_scope, experience_participant_id: participant.id)
      .each { |s| result[s.experience_block_id.to_s] = { id: s.id, answer: s.answer } }

    ExperienceNewsletterSubmission
      .where(experience_block_id: block_scope, experience_participant_id: participant.id)
      .each { |s| result[s.experience_block_id.to_s] = { id: s.id, answer: s.answer } }

    ExperiencePhotoUploadSubmission
      .where(experience_block_id: block_scope, experience_participant_id: participant.id)
      .includes(photo_attachment: :blob)
      .each do |s|
        photo_url = s.photo.attached? ? ActiveStorageUrlService.blob_url(s.photo.blob) : nil
        result[s.experience_block_id.to_s] = { id: s.id, answer: s.answer, photo_url: photo_url }
      end

    ImprovSuggestion.active
      .where(experience_block_id: block_scope, experience_participant_id: participant.id)
      .each do |s|
        result[s.experience_block_id.to_s] ||= {}
        result[s.experience_block_id.to_s][:own_suggestion] = { id: s.id, text: s.text }
      end

    @experience.experience_blocks.where(kind: ExperienceBlock::THE_SCENE).each do |block|
      scene_started_at = block.payload&.dig("scene_started_at")
      next unless scene_started_at.present?

      vote = ImprovVote.find_by(
        experience_block_id: block.id,
        experience_participant_id: participant.id,
        scene_started_at: scene_started_at
      )
      next unless vote

      result[block.id.to_s] ||= {}
      result[block.id.to_s][:own_vote_suggestion_id] = vote.improv_suggestion_id
    end

    ExperienceMinigameBalloonResult
      .where(experience_block_id: block_scope, experience_participant_id: participant.id)
      .each { |r| result[r.experience_block_id.to_s] = { fill_amount: r.fill_amount } }

    Feedback
      .where(experience_block_id: block_scope, experience_participant_id: participant.id)
      .each { |f| result[f.experience_block_id.to_s] = { id: f.id, answer: { submitted: true } } }
    ExperienceCollaborativeDrawingAssignment
      .where(experience_block_id: block_scope, experience_participant_id: participant.id)
      .includes(source_photo: { photo_attachment: :blob })
      .each do |a|
        source_url = a.source_photo&.photo&.attached? ? ActiveStorageUrlService.blob_url(a.source_photo.photo.blob) : nil
        result[a.experience_block_id.to_s] = {
          assignment: {
            group_index:      a.group_index,
            slice_index:      a.slice_index,
            slice_count:      a.slice_count,
            region:           a.grid_region,
            source_photo_url: source_url
          },
          image:     a.drawing_image,
          submitted: a.submitted_at.present?
        }
      end

    result
  end

  def find_experience_or_reject
    # Frontend sends 'code' param which contains the slug from URL
    # Accept both 'code' and 'code_slug'
    slug = params[:code_slug] || params[:code]

    experience = Experience.find_by(code_slug: slug)
    return experience if experience

    Rails.logger.warn "[ExperienceChannel] Experience not found with slug: #{slug}"
    reject
    nil
  end

  def authenticate_user_or_reject
    return [nil, false] unless @experience && params[:token]

    begin
      claims = Experiences::AuthService.decode!(params[:token])

      case claims[:scope]
      when Experiences::AuthService::ADMIN
        # Admin token - verify admin status
        user = Experiences::AuthService.admin_from_claims!(claims)
        return [user, true]
      when Experiences::AuthService::PARTICIPANT
        # Participant token - verify participant and experience
        user, exp = Experiences::AuthService.authorize_participant!(claims)

        unless exp.id == @experience.id
          Rails.logger.warn "[ExperienceChannel] Token for wrong experience"
          reject
          return [nil, false]
        end

        return [user, false]
      else
        Rails.logger.warn "[ExperienceChannel] Invalid token scope: #{claims[:scope]}"
        reject
        return [nil, false]
      end
    rescue Experiences::AuthService::TokenInvalid,
           Experiences::AuthService::TokenExpired,
           Experiences::AuthService::Unauthorized,
           Experiences::AuthService::NotFound => e
      Rails.logger.warn "[ExperienceChannel] Authentication failed: #{e.class}"
      reject
      [nil, false]
    end
  end

  def find_participant_record_or_reject
    return nil unless @user
    return nil if monitor_view_subscription?

    # Admins don't need participant records
    return nil if @is_admin

    participant_record = @experience.experience_participants.find_by(user: @user)
    return participant_record if participant_record

    Rails.logger.warn(
      "[ExperienceChannel] No participant record found for user #{@user.id} " \
      "in experience #{@experience.code}"
    )
    reject
    nil
  end

  def log_stream_subscription
    user_id = @user&.id || "anonymous"
    Rails.logger.info(
      "[ExperienceChannel] User #{user_id} subscribing to " \
      "experience #{@experience.code} via stream #{@current_stream}"
    )
  end

  def log_successful_subscription
    user_id = @user&.id || "anonymous"
    Rails.logger.info(
      "[ExperienceChannel] Successfully subscribed user #{user_id} " \
      "to experience #{@experience.code}"
    )
  end

  def log_unsubscription
    if @participant && @experience
      Rails.logger.info(
        "[ExperienceChannel] User #{@participant.user_id} " \
        "unsubscribed from experience #{@experience.code}"
      )
    else
      Rails.logger.info("[ExperienceChannel] User unsubscribed (no participant info available)")
    end
  end

  def log_resubscription_request
    Rails.logger.info(
      "[ExperienceChannel] Resubscription requested for user " \
      "#{@participant.user_id} in experience #{@experience.code}"
    )
  end

  def log_successful_resubscription
    Rails.logger.info(
      "[ExperienceChannel] Successfully resubscribed user " \
      "#{@participant.user_id} with updated payload"
    )
  end
end
