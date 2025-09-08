class Api::ExperiencesController < ApplicationController
  skip_before_action :verify_authenticity_token

  # POST /api/experiences
  def create
    @experience = Experience.new(code: generate_experience_code.downcase)

    if @experience.save
      render json: {
        success: true,
        experience: {
          id: @experience.id,
          code: @experience.code,
          created_at: @experience.created_at
        },
        lobby_url: lobby_url(@experience.code)
      }, status: :created
    else
      render json: {
        success: false,
        errors: @experience.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # POST /api/experiences/join
  def join
    @experience = Experience.find_by_code(params[:code].downcase)

    if @experience.blank?
      render json: {
        success: false,
        error: "Experience not found with code: #{params[:code]}"
      }, status: :not_found
    end

    render json: {
      success: true,
      experience: {
        id: @experience.id,
        code: @experience.code,
        participant_count: @experience.users.count,
        created_at: @experience.created_at
      },
      lobby_url: lobby_url(@experience.code)
    }, status: :ok
  end

  private

  def experience_params
    params.require(:experience).permit(:code)
  end

  def join_params
    params.require(:code)
  end

  def generate_experience_code
    # Use provided code or generate a new one
    experience_params[:code].presence || Experience.generate_code
  end

  def lobby_url(code)
    "#{request.base_url}/lobby/#{code}"
  end
end
