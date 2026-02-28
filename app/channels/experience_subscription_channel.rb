class ExperienceSubscriptionChannel < ApplicationCable::Channel
  def subscribed
    setup_experience_and_user

    if monitor_view_subscription?
      setup_monitor_view_subscription
    elsif impersonation_subscription?
      setup_impersonation_subscription
    else
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

  # Participant moved avatar position in lobby positioning mode (ephemeral)
  def avatar_position(data)
    return unless @experience && @participant && !monitor_view_subscription? && !@is_admin

    pos = data["position"] || {}
    ActionCable.server.broadcast(
      Experiences::Broadcaster.monitor_stream_key(@experience),
      {
        type: 'drawing_update',
        participant_id: @participant.id,
        operation: 'avatar_position',
        data: { position: pos },
      },
    )
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

  def impersonation_subscription?
    params[:as_participant_id].present?
  end

  def setup_monitor_view_subscription
    @current_stream = Experiences::Broadcaster.monitor_stream_key(@experience)
    @view_type = 'monitor'
    stream_from @current_stream
    log_stream_subscription
  end

  def setup_impersonation_subscription
    authorize_admin_or_host_or_reject
    target_participant = find_target_participant_or_reject
    return unless target_participant

    @impersonated_participant = target_participant
    @current_stream = stream_key_for_participant(target_participant)
    @view_type = 'impersonation'
    stream_from @current_stream
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
      @current_stream = admin_stream_key(@experience)
      @view_type = 'admin'
      Rails.logger.info("[ExperienceChannel] Routed to admin stream: #{@current_stream}")
    else
      @current_stream = stream_key_for_participant(@participant)
      @view_type = 'participant'
      Rails.logger.info("[ExperienceChannel] Routed to participant stream: #{@current_stream}")
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

  def admin_stream_key(experience)
    "experience_#{experience.id}_admins"
  end

  def send_initial_experience_state
    Rails.logger.info(
      "[ExperienceChannel] send_initial_experience_state: view_type=#{@view_type}, " \
      "user=#{@user&.id}, participant=#{@participant&.id}, is_admin=#{@is_admin}"
    )

    # Preload all data to avoid N+1 queries
    preloaded_data = preload_experience_data

    case @view_type
    when 'monitor'
      transmit(
        WebsocketMessageService.experience_state(
          @experience,
          visibility_payload: Experiences::Visibility.payload_for_monitor(
            experience: @experience,
            blocks: preloaded_data[:blocks],
            participants: preloaded_data[:participants],
            submissions_cache: preloaded_data[:submissions_cache]
          ),
          logical_stream: "monitor_view",
          participant_id: nil,
          include_participants: true,
          participants: preloaded_data[:participants]
        )
      )
    when 'impersonation'
      transmit(
        WebsocketMessageService.experience_state(
          @experience,
          visibility_payload: Experiences::Visibility.payload_for_user(
            experience: @experience,
            user: @impersonated_participant.user,
            participant: @impersonated_participant,
            blocks: preloaded_data[:blocks],
            submissions_cache: preloaded_data[:submissions_cache],
            participants_by_user_id: preloaded_data[:participants_by_user_id]
          ),
          logical_stream: "participant_#{@impersonated_participant.id}",
          participant_id: @impersonated_participant.id,
          include_participants: true,
          participants: preloaded_data[:participants]
        )
      )
    else
      # Admin or participant stream
      is_manager = (@is_admin && !@participant) || is_host_or_moderator?

      Rails.logger.info(
        "[ExperienceChannel] Else branch: is_manager=#{is_manager}, " \
        "is_admin=#{@is_admin}, participant=#{@participant&.id}, " \
        "is_host_or_mod=#{is_host_or_moderator?}"
      )

      if is_manager
        # Admin/host viewing full experience (managers get full view)
        Rails.logger.info("[ExperienceChannel] Sending admin initial state")
        transmit(
          WebsocketMessageService.experience_state(
            @experience,
            visibility_payload: Experiences::Visibility.payload_for_user(
              experience: @experience,
              user: @user,
              participant: @participant,
              blocks: preloaded_data[:blocks],
              submissions_cache: preloaded_data[:submissions_cache],
              participants_by_user_id: preloaded_data[:participants_by_user_id]
            ),
            logical_stream: "admin_view",
            participant_id: nil,
            include_participants: true,
            participants: preloaded_data[:participants]
          )
        )
      else
        # Regular participant stream
        Rails.logger.info(
          "[ExperienceChannel] Sending participant initial state: " \
          "participant_id=#{@participant.id}, user_id=#{@user.id}"
        )

        payload = payload_for_participant(@user)
        Rails.logger.info(
          "[ExperienceChannel] Participant payload: " \
          "blocks_count=#{payload.dig(:experience, :blocks)&.length || 0}"
        )

        participant_summary = {
          id: @participant.id,
          user_id: @participant.user_id,
          name: @participant.name,
          email: @participant.user.email,
          role: @participant.role
        }

        transmit(
          WebsocketMessageService.experience_state(
            @experience,
            visibility_payload: Experiences::Visibility.payload_for_user(
              experience: @experience,
              user: @user,
              participant: @participant,
              blocks: preloaded_data[:blocks],
              submissions_cache: preloaded_data[:submissions_cache],
              participants_by_user_id: preloaded_data[:participants_by_user_id]
            ),
            logical_stream: "participant_#{@participant.id}",
            participant_id: @participant.id,
            participant: participant_summary,
            include_participants: true,
            participants: preloaded_data[:participants]
          )
        )
      end
    end
  end

  def valid_resubscription_request?
    @participant && @experience
  end

  def reload_participant_data
    @participant.reload
  end

  def send_updated_experience_state
    participant_summary = {
      id: @participant.id,
      user_id: @participant.user_id,
      name: @participant.name,
      email: @participant.user.email,
      role: @participant.role
    }

    # Preload all data to avoid N+1 queries
    preloaded_data = preload_experience_data

    transmit(
      WebsocketMessageService.experience_state(
        @experience,
        visibility_payload: Experiences::Visibility.payload_for_user(
          experience: @experience,
          user: @user,
          participant: @participant,
          blocks: preloaded_data[:blocks],
          submissions_cache: preloaded_data[:submissions_cache],
          participants_by_user_id: preloaded_data[:participants_by_user_id]
        ),
        logical_stream: "participant_#{@participant.id}",
        participant_id: @participant.id,
        participant: participant_summary,
        include_participants: true,
        participants: preloaded_data[:participants]
      )
    )
  end

  def preload_experience_data
    # Load all blocks with all associations
    blocks = @experience.experience_blocks
      .includes(
        :experience_poll_submissions,
        :experience_question_submissions,
        :experience_multistep_form_submissions,
        :experience_mad_lib_submissions,
        :child_links,
        :parent_links,
        children: [
          :experience_poll_submissions,
          :experience_question_submissions,
          :experience_multistep_form_submissions,
          :experience_mad_lib_submissions,
          :child_links,
          :parent_links
        ],
        parents: [],
        variables: { bindings: :source_block }
      )
      .order(position: :asc)
      .to_a

    # Load all participants with users
    participants = @experience.experience_participants.includes(:user).to_a

    # Build in-memory cache of submissions
    submissions_cache = build_submissions_cache(blocks)

    # Build participant lookup by user_id
    participants_by_user_id = participants.index_by(&:user_id)

    {
      blocks: blocks,
      participants: participants,
      submissions_cache: submissions_cache,
      participants_by_user_id: participants_by_user_id
    }
  end

  def build_submissions_cache(blocks)
    cache = {}

    blocks.each do |block|
      cache[block.id] = {}

      block.experience_poll_submissions.each do |submission|
        cache[block.id][submission.user_id] = submission
      end

      block.experience_question_submissions.each do |submission|
        cache[block.id][submission.user_id] = submission
      end

      block.experience_multistep_form_submissions.each do |submission|
        cache[block.id][submission.user_id] = submission
      end

      block.experience_mad_lib_submissions.each do |submission|
        cache[block.id][submission.user_id] = submission
      end

      block.children.each do |child|
        cache[child.id] ||= {}

        child.experience_poll_submissions.each do |submission|
          cache[child.id][submission.user_id] = submission
        end

        child.experience_question_submissions.each do |submission|
          cache[child.id][submission.user_id] = submission
        end

        child.experience_multistep_form_submissions.each do |submission|
          cache[child.id][submission.user_id] = submission
        end

        child.experience_mad_lib_submissions.each do |submission|
          cache[child.id][submission.user_id] = submission
        end
      end
    end

    cache
  end

  def find_experience_or_reject
    # Frontend sends 'code' param which contains the slug from URL
    # Accept both 'code' and 'code_slug' for backward compatibility during transition
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
    return nil if monitor_view_subscription? || impersonation_subscription?

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

  def authorize_admin_or_host_or_reject
    unless @user
      Rails.logger.warn(
        "[ExperienceChannel] No authenticated user for admin/host operation"
      )
      reject
      return
    end

    # If authenticated with admin JWT (system admin), allow immediately
    if @is_admin
      return
    end

    # Otherwise, check if user is a host/moderator for this experience
    participant_record = @experience.experience_participants.find_by(
      user: @user
    )

    is_system_admin = @user.admin? || @user.superadmin?
    is_experience_host = participant_record&.role == 'host'
    is_experience_moderator = participant_record&.role == 'moderator'

    unless is_system_admin || is_experience_host || is_experience_moderator
      Rails.logger.warn(
        "[ExperienceChannel] User #{@user.id} not authorized " \
        "for admin/host operation (not a system admin, host, or moderator)"
      )
      reject
      return
    end
  end

  def find_target_participant_or_reject
    target = @experience.experience_participants.find_by(
      id: params[:as_participant_id]
    )

    unless target
      Rails.logger.warn(
        "[ExperienceChannel] Target participant " \
        "#{params[:as_participant_id]} not found"
      )
      reject
      return nil
    end

    target
  end

  def stream_key_for_participant(participant)
    "experience_#{participant.experience_id}_participant_#{participant.id}"
  end

  def payload_for_participant(user)
    preloaded_data = preload_experience_data
    Experiences::Visibility.payload_for_user(
      experience: @experience,
      user: user,
      blocks: preloaded_data[:blocks],
      submissions_cache: preloaded_data[:submissions_cache],
      participants_by_user_id: preloaded_data[:participants_by_user_id]
    )
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
