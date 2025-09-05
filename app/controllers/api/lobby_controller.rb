# app/controllers/api/lobby_controller.rb
class Api::LobbyController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :find_session_by_code

  # POST /api/lobby/:code/check_fingerprint
  def check_fingerprint
    fingerprint = params[:fingerprint]

    if fingerprint.blank?
      render json: { success: false, error: 'Fingerprint required' }, status: :bad_request
      return
    end

    participant = @session.find_participant_by_fingerprint(fingerprint)

    if participant
      render json: {
        success: true,
        user: {
          id: participant.user.id,
          name: participant.user.name
        },
        session: {
          id: @session.id,
          code: @session.code,
          participant_count: @session.users.count
        }
      }
    else
      render json: { success: false, message: 'Fingerprint not found in session' }
    end
  end

  # POST /api/lobby/:code/join
  def join
    fingerprint = join_params[:fingerprint]

    if fingerprint.blank?
      render json: { success: false, error: 'Fingerprint required' }, status: :bad_request
      return
    end

    # Check if fingerprint already exists in this session
    existing_participant = @session.find_participant_by_fingerprint(fingerprint)
    if existing_participant
      render json: {
        success: true,
        user: {
          id: existing_participant.user.id,
          name: existing_participant.user.name
        },
        session: {
          id: @session.id,
          code: @session.code,
          participant_count: @session.users.count
        }
      }
      return
    end

    # Create new user and add to session
    @user = User.new(user_params)

    if @user.save
      @session.add_user(@user, fingerprint)

      render json: {
        success: true,
        user: {
          id: @user.id,
          name: @user.name
        },
        session: {
          id: @session.id,
          code: @session.code,
          participant_count: @session.users.count
        }
      }, status: :created
    else
      render json: {
        success: false,
        errors: @user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # GET /api/lobby/:code
  def show
    render json: {
      success: true,
      session: {
        id: @session.id,
        code: @session.code,
        participant_count: @session.users.count,
        participants: @session.users.map { |user| { id: user.id, name: user.name } }
      }
    }
  end

  private

  def user_params
    params.require(:user).permit(:name)
  end

  def join_params
    params.permit(:fingerprint).merge(params.require(:user).permit(:name))
  end

  def find_session_by_code
    @session = Session.find_by_code(params[:code])

    unless @session
      render json: {
        success: false,
        error: "Session not found with code: #{params[:code]}"
      }, status: :not_found
    end
  end
end
