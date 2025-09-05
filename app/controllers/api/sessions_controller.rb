class Api::SessionsController < ApplicationController
  skip_before_action :verify_authenticity_token

  before_action :find_session_by_code, only: [:join]

  # POST /api/sessions
  def create
    @session = Session.new(code: generate_session_code)

    if @session.save
      render json: {
        success: true,
        session: {
          id: @session.id,
          code: @session.code,
          created_at: @session.created_at
        },
        lobby_url: lobby_url(@session.code)
      }, status: :created
    else
      render json: {
        success: false,
        errors: @session.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # POST /api/sessions/join
  def join
    render json: {
      success: true,
      session: {
        id: @session.id,
        code: @session.code,
        participant_count: @session.users.count,
        created_at: @session.created_at
      },
      lobby_url: lobby_url(@session.code)
    }, status: :ok
  end

  private

  def session_params
    params.require(:session).permit(:code)
  end

  def join_params
    params.require(:code)
  end

  def find_session_by_code
    @session = Session.find_by_code(code.downcase)

    unless @session
      render json: {
        success: false,
        error: "Session not found with code: #{code}"
      }, status: :not_found
    end
  end

  def generate_session_code
    # Use provided code or generate a new one
    session_params[:code].presence || Session.generate_code
  end

  def lobby_url(code)
    "#{request.base_url}/lobby/#{code}"
  end
end
