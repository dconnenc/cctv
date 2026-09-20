# Feedback screenshots and screen recordings are far larger than the block photo
# uploads Api::DirectUploadsController guards, so they get their own endpoint
# with its own ceiling rather than a client-supplied flag widening the existing
# image-only rule for everyone.
class Api::FeedbackDirectUploadsController < ActiveStorage::DirectUploadsController
  skip_forgery_protection
  include Passwordless::ControllerHelpers

  ALLOWED_CONTENT_TYPES = Feedback::ATTACHMENT_CONTENT_TYPES

  before_action :require_signed_in_user
  before_action :validate_upload_params

  private

  def require_signed_in_user
    return if jwt_user? || session_user?

    render json: { error: "Sign in to attach files" }, status: :unauthorized
  end

  def jwt_user?
    token = request.headers["Authorization"]&.to_s&.match(/\ABearer\s+(.+)\z/i)&.captures&.first
    return false unless token

    Experiences::AuthService.decode!(token).present?
  rescue Experiences::AuthService::TokenInvalid, Experiences::AuthService::TokenExpired
    false
  end

  def session_user?
    authenticate_by_session(User).present?
  end

  def validate_upload_params
    content_type = params[:blob]&.dig(:content_type) || params[:content_type]
    byte_size = params[:blob]&.dig(:byte_size) || params[:byte_size]

    unless ALLOWED_CONTENT_TYPES.include?(content_type.to_s)
      render json: { error: "Only images and videos can be attached" }, status: :unprocessable_entity
      return
    end

    if byte_size.to_i > Feedback::MAX_ATTACHMENT_BYTES
      megabytes = Feedback::MAX_ATTACHMENT_BYTES / 1.megabyte
      render json: { error: "Files must be under #{megabytes} MB" }, status: :unprocessable_entity
    end
  end
end
