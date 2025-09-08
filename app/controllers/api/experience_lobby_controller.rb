class Api::ExperienceLobbyController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :find_experience_by_code

  # POST /api/lobby/:code/check_fingerprint
  def check_fingerprint
    fingerprint = params[:fingerprint]

    if fingerprint.blank?
      render json: { success: false, error: 'Fingerprint required' }, status: :bad_request
      return
    end

    participant = @experience.find_participant_by_fingerprint(fingerprint)

    if participant
      render json: {
        success: true,
        user: {
          id: participant.user.id,
          name: participant.user.name
        },
        experience: {
          id: @experience.id,
          code: @experience.code,
          participant_count: @experience.users.count
        }
      }
    else
      render json: { success: false, message: 'Fingerprint not found in experience' }
    end
  end

  # POST /api/lobby/:code/join
  def join
    fingerprint = join_params[:fingerprint]

    if fingerprint.blank?
      render json: { success: false, error: 'Fingerprint required' }, status: :bad_request
      return
    end

    # Check if fingerprint already exists in this experience
    existing_participant = @experience.find_participant_by_fingerprint(fingerprint)
    if existing_participant
      render json: {
        success: true,
        user: {
          id: existing_participant.user.id,
          name: existing_participant.user.name
        },
        experience: {
          id: @experience.id,
          code: @experience.code,
          participant_count: @experience.users.count
        }
      }
      return
    end

    # Create new user and add to experience
    @user = User.new(user_params)

    if @user.save
      @experience.add_user(@user, fingerprint)

      render json: {
        success: true,
        user: {
          id: @user.id,
          name: @user.name
        },
        experience: {
          id: @experience.id,
          code: @experience.code,
          participant_count: @experience.users.count
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
      experience: {
        id: @experience.id,
        code: @experience.code,
        participant_count: @experience.users.count,
        participants: @experience.users.map { |user| { id: user.id, name: user.name } }
      }
    }
  end

  # POST /api/lobby/:code/start
  def start
    @experience.started = true

    if @experience.save
      render json: {
        success: updated,
        experience: {
          id: @experience.id,
          code: @experience.code,
        }
      }, status: (updated ? :ok : :unprocessable_entity)
    else
      render json: { success: false, error: 'Experience not updatable' }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(:name)
  end

  def join_params
    params.permit(:fingerprint).merge(params.require(:user).permit(:name))
  end

  def find_experience_by_code
    @experience = Experience.find_by_code(params[:code])

    unless @experience
      render json: {
        success: false,
        error: "Experience not found with code: #{params[:code]}"
      }, status: :not_found
    end
  end
end
