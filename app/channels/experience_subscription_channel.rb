class ExperienceSubscriptionChannel < ApplicationCable::Channel
  def subscribed
    setup_experience_and_participant

    if tv_view_subscription?
      setup_tv_view_subscription
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

  def resubscribe
    return reject unless valid_resubscription_request?

    log_resubscription_request
    reload_participant_data
    send_updated_experience_state
    log_successful_resubscription
  end

  private

  def setup_experience_and_participant
    @experience = find_experience_or_reject
    @participant = authenticate_participant_or_reject
    @participant_record = find_participant_record_or_reject
  end

  def tv_view_subscription?
    params[:view_type] == 'tv'
  end

  def impersonation_subscription?
    params[:as_participant_id].present?
  end

  def setup_tv_view_subscription
    authorize_admin_or_host_or_reject
    @current_stream = Experiences::Broadcaster.tv_stream_key(@experience)
    @view_type = 'tv'
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
    @current_stream = stream_key_for_participant(@participant_record)
    @view_type = 'participant'
    stream_from @current_stream
    log_stream_subscription
  end

  def send_initial_experience_state
    case @view_type
    when 'tv'
      transmit(
        WebsocketMessageService.experience_state(
          @experience,
          visibility_payload: Experiences::Visibility.payload_for_tv(
            experience: @experience
          ),
          logical_stream: "tv_view",
          participant_id: nil
        )
      )
    when 'impersonation'
      transmit(
        WebsocketMessageService.experience_state(
          @experience,
          visibility_payload: payload_for_participant(
            @impersonated_participant.user
          ),
          logical_stream: "participant_#{@impersonated_participant.id}",
          participant_id: @impersonated_participant.id
        )
      )
    else
      transmit(
        WebsocketMessageService.experience_state(
          @experience,
          visibility_payload: payload_for_participant(@participant),
          logical_stream: "participant_#{@participant_record.id}",
          participant_id: @participant_record.id
        )
      )
    end
  end

  def valid_resubscription_request?
    @participant_record && @experience
  end

  def reload_participant_data
    @participant_record.reload
  end

  def send_updated_experience_state
    transmit(
      WebsocketMessageService.experience_state(
        @experience,
        visibility_payload: payload_for_participant(@participant_record.user),
        logical_stream: "participant_#{@participant_record.id}",
        participant_id: @participant_record.id
      )
    )
  end

  def find_experience_or_reject
    experience = Experience.find_by(code: params[:code])
    return experience if experience

    Rails.logger.warn "[ExperienceChannel] Experience not found: #{params[:code]}"
    reject
    nil
  end

  def authenticate_participant_or_reject
    return nil unless @experience && params[:token]

    begin
      claims = Experiences::AuthService.decode!(params[:token])
      user, exp = Experiences::AuthService.authorize_participant!(claims)

      unless exp.id == @experience.id
        Rails.logger.warn "[ExperienceChannel] Token for wrong experience"
        reject
        return nil
      end

      user
    rescue Experiences::AuthService::TokenInvalid,
           Experiences::AuthService::TokenExpired,
           Experiences::AuthService::Unauthorized,
           Experiences::AuthService::NotFound => e
      Rails.logger.warn "[ExperienceChannel] Authentication failed: #{e.class}"
      reject
      nil
    end
  end

  def find_participant_record_or_reject
    return nil unless @participant
    return nil if tv_view_subscription? || impersonation_subscription?

    participant_record = @experience.experience_participants.find_by(user: @participant)
    return participant_record if participant_record

    Rails.logger.warn(
      "[ExperienceChannel] No participant record found for user #{@participant.id} " \
      "in experience #{@experience.code}"
    )
    reject
    nil
  end

  def authorize_admin_or_host_or_reject
    unless @participant
      Rails.logger.warn(
        "[ExperienceChannel] No authenticated user for admin operation"
      )
      reject
      return
    end

    participant_record = @experience.experience_participants.find_by(
      user: @participant
    )

    is_admin = @participant.admin? || @participant.superadmin?
    is_host = participant_record&.role == 'host'
    is_moderator = participant_record&.role == 'moderator'

    unless is_admin || is_host || is_moderator
      Rails.logger.warn(
        "[ExperienceChannel] User #{@participant.id} not authorized " \
        "for admin operation"
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
    Experiences::Visibility.payload_for_user(experience: @experience, user: user)
  end

  def log_stream_subscription
    Rails.logger.info(
      "[ExperienceChannel] User #{@participant.id} subscribing to " \
      "experience #{@experience.code} via stream #{@current_stream}"
    )
  end

  def log_successful_subscription
    Rails.logger.info(
      "[ExperienceChannel] Successfully subscribed user #{@participant.id} " \
      "to experience #{@experience.code}"
    )
  end

  def log_unsubscription
    if @participant_record && @experience
      Rails.logger.info(
        "[ExperienceChannel] User #{@participant_record.user_id} " \
        "unsubscribed from experience #{@experience.code}"
      )
    else
      Rails.logger.info("[ExperienceChannel] User unsubscribed (no participant info available)")
    end
  end

  def log_resubscription_request
    Rails.logger.info(
      "[ExperienceChannel] Resubscription requested for user " \
      "#{@participant_record.user_id} in experience #{@experience.code}"
    )
  end

  def log_successful_resubscription
    Rails.logger.info(
      "[ExperienceChannel] Successfully resubscribed user " \
      "#{@participant_record.user_id} with updated payload"
    )
  end
end
