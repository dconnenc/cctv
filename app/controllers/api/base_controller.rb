class Api::BaseController < ApplicationController
  skip_before_action :verify_authenticity_token

  class UnauthorizedError < StandardError; end
  class NotFoundError < StandardError; end

  def authenticate_and_set_user_and_experience
    if session_admin_signed_in?
      set_as_session_admin
    elsif bearer_token
      claims = Experiences::AuthService.decode!(bearer_token)

      case claims[:scope]
      when Experiences::AuthService::PARTICIPANT
        set_as_jwt_participant(claims)
      when Experiences::AuthService::ADMIN
        set_as_jwt_admin(claims)
      else
        raise UnauthorizedError, "unknown or missing scope"
      end
    else
      raise UnauthorizedError, "no credentials"
    end
  end

  private

  def session_admin_signed_in?
    current_user&.admin? || current_user&.superadmin?
  end

  def set_as_session_admin
    @auth_source = :session_admin
    @user        = current_user
    @experience  = find_experience_by_code!(experience_code)
  end

  def set_as_jwt_participant(claims)
    @auth_source = :jwt_participant
    @user, @experience = Experiences::AuthService.authorize_participant!(claims)

    if experience_code.present? && experience_code != @experience.code
      raise UnauthorizedError, "experience mismatch"
    end
  end

  def set_as_session_admin(claims)
    @auth_source = :jwt_admin
    @user        = Experiences::AuthService.admin_from_claims!(claims)
    @experience  = find_experience_by_code!(requested_experience_code!)
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

  def experience_code
    %w[id experience_id code]
      .map { |k| params[k] }
      .compact
      .first
      &.to_s
      &.strip
  end

  def find_experience_by_code!(code)
    ::Experience.find_by!(code: code)
  rescue ActiveRecord::RecordNotFound
    raise NotFoundError, "experience not found"
  end
end
