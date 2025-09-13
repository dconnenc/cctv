class Api::ExperiencesController < ApplicationController
  skip_before_action :verify_authenticity_token

  # POST /api/experiences
  def create
    @experience = Experience.new(experience_create_params)

    if @experience.save
      render json: {
        success: true,
        experience: {
          id: @experience.id,
          name: @experience.name,
          code: @experience.code,
          created_at: @experience.created_at
        },
        lobby_url: lobby_url(@experience.code)
      }, status: :created
    else
      render json: {
        success: false,
        error: @experience.errors.full_messages.join(', ')
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

  def experience_create_params
    {
      name: params[:name],
      code: params[:code]&.downcase || Experience.generate_code.downcase
    }
  end

  def join_params
    params.require(:code)
  end

  def lobby_url(code)
    "#{request.base_url}/lobby/#{code}"
  end
end
