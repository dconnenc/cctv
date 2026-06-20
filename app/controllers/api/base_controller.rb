class Api::BaseController < ApplicationController
  skip_before_action :verify_authenticity_token

  include Passwordless::ControllerHelpers

  authorize :user, through: :policy_user

  rescue_from ActionPolicy::Unauthorized, with: :render_forbidden

  class UnauthorizedError < StandardError; end
  class NotFoundError < StandardError; end

  # Expected control-flow errors that already map to a deliberate response.
  # Everything else that escapes an action is an unexpected bug worth tracking.
  # Matched by name (including ancestors) to avoid forcing autoload of the
  # Experiences::* error constants at class-load time.
  IGNORED_EXCEPTION_NAMES = %w[
    Api::BaseController::UnauthorizedError
    Api::BaseController::NotFoundError
    ActionPolicy::Unauthorized
    ActionController::ParameterMissing
    ActiveRecord::RecordNotFound
    ActiveRecord::RecordInvalid
    Experiences::InvalidTransitionError
    Experiences::MysteryNotRespondedError
    Experiences::UnsafeEditError
  ].freeze

  around_action :report_unexpected_errors

  def authenticate_and_set_user_and_experience
    # JWT takes precedence over session auth when present
    # This allows simulating requests as different users while logged in as admin
    if bearer_token
      claims = Experiences::AuthService.decode!(bearer_token)

      case claims[:scope]
      when Experiences::AuthService::PARTICIPANT
        set_as_jwt_participant(claims)
      when Experiences::AuthService::ADMIN
        set_as_jwt_admin(claims)
      else
        raise UnauthorizedError, "unknown or missing scope"
      end
    elsif session_admin_signed_in?
      set_as_session_admin
    else
      raise UnauthorizedError, "no credentials"
    end
  end

  private

  def policy_user
    @user || current_user
  end

  def render_forbidden
    render json: { success: false, error: "forbidden" }, status: :forbidden
  end

  def session_admin_signed_in?
    current_user&.admin? || current_user&.superadmin?
  end

  def set_as_session_admin
    @auth_source = :session_admin
    @user        = current_user
    @experience  = find_experience_by_slug!(experience_slug)
  end

  def set_as_jwt_participant(claims)
    @auth_source = :jwt_participant
    @user, @experience = Experiences::AuthService.authorize_participant!(claims)

    # Verify URL slug matches the experience from JWT
    if experience_slug.present? && experience_slug != @experience.code_slug
      raise UnauthorizedError, "experience mismatch"
    end
  end

  def set_as_jwt_admin(claims)
    @auth_source = :jwt_admin
    @user = Experiences::AuthService.admin_from_claims!(claims)
    @experience = find_experience_by_slug!(experience_slug)
  end

  def bearer_token
    @bearer_token ||= begin
      auth_header
        &.to_s
        &.match(/\ABearer\s+(.+)\z/i)
        &.captures
        &.first
    end
  end

  def auth_header
    request.headers["Authorization"] || request.headers["HTTP_AUTHORIZATION"]
  end

  def find_experience_by_slug!(slug)
    ::Experience.find_by!(code_slug: slug)
  rescue ActiveRecord::RecordNotFound
    raise NotFoundError, "experience not found"
  end

  def experience_slug
    %w[experience_id id code]
      .map { |k| params[k] }
      .compact
      .first
      &.to_s
      &.strip
  end

  def with_experience_orchestration
    begin
      yield
    rescue Experiences::MysteryNotRespondedError => e
      render json: {
        success: false,
        missing_mystery: true,
        error: e.message,
      }, status: :unprocessable_entity
    rescue Experiences::InvalidTransitionError => e
      render json: {
        success: false,
        message: "Invalid state transition",
        error: e.message,
      }, status: :unprocessable_entity
    rescue Experiences::UnsafeEditError => e
      render json: {
        success: false,
        message: "Edit not allowed",
        error: e.message,
      }, status: :unprocessable_entity
    rescue ActiveRecord::RecordInvalid => e
      render json: {
        success: false,
        error: e.record.errors.full_messages.first,
      }, status: :unprocessable_entity
    end
  end

  # Reports genuinely unexpected exceptions to PostHog error tracking, then
  # re-raises so existing rendering/rescue behavior is unchanged.
  def report_unexpected_errors
    yield
  rescue StandardError => e
    unless ignored_exception?(e)
      Analytics::Tracker.capture_exception(
        e,
        distinct_id: @user&.id,
        properties: {
          controller: controller_name,
          action: action_name,
          path: request.path,
          method: request.method,
          experience_code: @experience&.code,
        },
      )
    end
    raise
  end

  def ignored_exception?(error)
    error.class.ancestors.any? do |ancestor|
      ancestor.respond_to?(:name) && IGNORED_EXCEPTION_NAMES.include?(ancestor.name)
    end
  end

  # Captures a domain event for the authenticated user and current experience.
  def track_event(event, properties = {})
    Analytics::Tracker.capture(
      distinct_id: @user&.id,
      event: event,
      properties: properties,
      experience: @experience,
    )
  end
end
