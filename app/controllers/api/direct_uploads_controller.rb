class Api::DirectUploadsController < ActiveStorage::DirectUploadsController
  skip_forgery_protection

  before_action :authenticate_jwt
  before_action :validate_upload_params

  private

  def authenticate_jwt
    token = request.headers["Authorization"]&.to_s&.match(/\ABearer\s+(.+)\z/i)&.captures&.first

    unless token
      render json: { error: "Missing authorization token" }, status: :unauthorized
      return
    end

    Experiences::AuthService.decode!(token)
  rescue Experiences::AuthService::TokenInvalid, Experiences::AuthService::TokenExpired
    render json: { error: "Invalid or expired token" }, status: :unauthorized
  end

  def validate_upload_params
    content_type = params[:blob]&.dig(:content_type) || params[:content_type]
    byte_size = params[:blob]&.dig(:byte_size) || params[:byte_size]

    unless content_type.to_s.start_with?("image/")
      render json: { error: "Only image uploads are allowed" }, status: :unprocessable_entity
      return
    end

    if byte_size.to_i > 7.megabytes
      render json: { error: "File size must be less than 7 MB" }, status: :unprocessable_entity
      return
    end
  end
end
