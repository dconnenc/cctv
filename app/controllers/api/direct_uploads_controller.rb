class Api::DirectUploadsController < ActiveStorage::DirectUploadsController
  skip_forgery_protection
  include Passwordless::ControllerHelpers

  before_action :authenticate_jwt
  before_action :validate_upload_params

  private

  def authenticate_jwt
    token = request.headers["Authorization"]&.to_s&.match(/\ABearer\s+(.+)\z/i)&.captures&.first

    if token
      Experiences::AuthService.decode!(token)
    elsif session_admin?
      # Session-authenticated admin, allow
    else
      render json: { error: "Missing authorization token" }, status: :unauthorized
    end
  rescue Experiences::AuthService::TokenInvalid, Experiences::AuthService::TokenExpired
    render json: { error: "Invalid or expired token" }, status: :unauthorized
  end

  def session_admin?
    user = authenticate_by_session(User)
    user&.admin? || user&.superadmin?
  end

  def validate_upload_params
    content_type = params[:blob]&.dig(:content_type) || params[:content_type]
    byte_size = params[:blob]&.dig(:byte_size) || params[:byte_size]

    if content_type.to_s.start_with?("image/")
      if byte_size.to_i > 7.megabytes
        render json: { error: "File size must be less than 7 MB" }, status: :unprocessable_entity
      end
    elsif content_type.to_s.start_with?("video/")
      if byte_size.to_i > 60.megabytes
        render json: { error: "File size must be less than 60 MB" }, status: :unprocessable_entity
      end
    else
      render json: { error: "Only image and video uploads are allowed" }, status: :unprocessable_entity
    end
  end
end
