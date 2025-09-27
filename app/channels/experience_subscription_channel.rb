class ExperienceSubscriptionChannel < ApplicationCable::Channel
  def subscribed
    setup_experience_and_participant
    setup_stream_subscription
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

    new_streams = calculate_new_streams

    if stream_change_required?(new_streams)
      perform_stream_change(new_streams)
      send_stream_changed_notification(new_streams)
      log_successful_resubscription(new_streams)
    else
      log_no_stream_change_needed
    end
  end

  private

  def setup_experience_and_participant
    @experience = find_experience_or_reject
    @participant = authenticate_participant_or_reject
    @participant_record = find_participant_record_or_reject
  end

  def setup_stream_subscription
    @current_streams = calculate_current_streams
    stream_from @current_streams[:action_cable]
    log_stream_subscription
  end

  def send_initial_experience_state
    transmit(
        WebsocketMessageService.experience_state(
        @experience,
        visibility_payload: payload_for_participant(@participant),
        logical_stream: @current_streams[:logical],
        participant_id: @participant_record.id
      )
    )
  end

  def valid_resubscription_request?
    @participant_record && @experience
  end

  def reload_participant_data
    @participant_record.reload
  end

  def calculate_new_streams
    stream_generator = Experiences::StreamKeyGenerator.new(@experience)
    {
      logical: stream_generator.stream_key_for_participant(@participant_record),
      action_cable: stream_generator.action_cable_stream_key_for_participant(@participant_record)
    }
  end

  def stream_change_required?(new_streams)
    new_streams[:logical] != @current_streams[:logical]
  end

  def perform_stream_change(new_streams)
    stop_stream_from @current_streams[:action_cable]
    stream_from new_streams[:action_cable]

    @current_streams = new_streams
  end

  def send_stream_changed_notification(new_streams)
    transmit(
      WebsocketMessageService.stream_changed(
        @experience,
        visibility_payload: payload_for_participant(@participant_record.user),
        old_stream: @current_streams[:logical],
        new_stream: new_streams[:logical],
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

    participant_record = @experience.experience_participants.find_by(user: @participant)
    return participant_record if participant_record

    Rails.logger.warn(
      "[ExperienceChannel] No participant record found for user #{@participant.id} " \
      "in experience #{@experience.code}"
    )
    reject
    nil
  end

  def calculate_current_streams
    stream_generator = Experiences::StreamKeyGenerator.new(@experience)
    {
      logical: stream_generator.stream_key_for_participant(@participant_record),
      action_cable: stream_generator.action_cable_stream_key_for_participant(@participant_record)
    }
  end

  def payload_for_participant(user)
    Experiences::Visibility.payload_for_user(experience: @experience, user: user)
  end

  def log_stream_subscription
    Rails.logger.info(
      "[ExperienceChannel] User #{@participant.id} subscribing to " \
      "experience #{@experience.code} via stream " \
      "#{@current_streams[:logical]} -> #{@current_streams[:action_cable]}"
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

  def log_successful_resubscription(new_streams)
    Rails.logger.info(
      "[ExperienceChannel] Stream change detected: " \
      "#{@current_streams[:logical]} -> #{new_streams[:logical]}"
    )
    Rails.logger.info(
      "[ExperienceChannel] Successfully resubscribed user " \
      "#{@participant_record.user_id} to new stream #{new_streams[:logical]}"
    )
  end

  def log_no_stream_change_needed
    Rails.logger.debug(
      "[ExperienceChannel] No stream change needed for user #{@participant_record.user_id}"
    )
  end
end
