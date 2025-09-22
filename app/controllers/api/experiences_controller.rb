class Api::ExperiencesController < Api::BaseController
  authorize :user, through: :current_user
  before_action :authenticate_and_set_user_and_experience,
    only: [:open_lobby, :start, :pause, :resume]

  # POST /api/experiences
  def create
    authorize! Experience, to: :create?

    valid, message = Experience.validate_code(params[:experience][:code])

    if valid
      experience = current_user.created_experiences.build(
        name: params[:experience][:name],
        code: params[:experience][:code]
      )

      if experience.save
        render json: {
          type: 'success',
          success: true,
          experience: {
            id: experience.id,
            code: experience.code,
            created_at: experience.created_at,
            url: generate_experience_path(experience.code)
          },
        }, status: :created
      else
        render json: {
          type: 'error',
          success: false,
          message: "Failed to create experience",
          error: experience.errors.full_messages.to_sentence
        }, status: :unprocessable_entity
      end
    else
      render json: {
        type: 'error',
        success: false,
        message: "Invalid experience code",
        error: message
      }, status: :unprocessable_entity
    end
  end

  # POST /api/experiences/open_lobby
  def open_lobby
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).open_lobby!

      render json: {
        success: true,
        data: @experience,
      }, status: :ok
    end
  end

  # POST /api/experiences/start
  def start
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).start!

      render json: {
        success: true,
        data: @experience,
      }, status: :ok
    end
  end

  # POST /api/experiences/pause
  def pause
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).pause!

      render json: {
        success: true,
        data: @experience,
      }, status: :ok
    end
  end

  # POST /api/experiences/resume
  def resume
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).resume!

      render json: {
        success: true,
        data: @experience,
      }, status: :ok
    end
  end

  # GET /api/experiences/:id
  def show
    experience = Experience.find_by(code: params[:id])

    if experience.nil?
      render json: { type: 'error', error: "Invalid experience code" }, status: :not_found
      return
    end

    authorize! experience, to: :show?

    render json: {
      type: 'success',
      success: true,
      experience: {
        id: experience.id,
        code: experience.code,
        status: experience.status,
        blocks: experience.experience_blocks.map do |block|
          {
            id: block.id,
            kind: block.kind,
            status: block.status,
            payload: block.payload,
            visible_to_roles: block.visible_to_roles,
            visible_to_segments: block.visible_to_segments,
            target_user_ids: block.target_user_ids,
          }
        end,
        hosts: experience.hosts do |participants|
          {
            id: participant.user.id,
            name: participant.user.name,
            email: participant.user.email,
            role: participant.role
          }
        end,
        participants: experience.experience_participants.map do |participant|
          {
            id: participant.user.id,
            name: participant.user.name,
            email: participant.user.email,
            role: participant.role
          }
        end
      },
      user: current_user ? {
        id: current_user.id,
        name: current_user.name,
        email: current_user.email
      } : nil
    }
  end

  # POST /api/experiences/join
  # Handles code submission - checks if user exists and is registered
  def join
    code = join_params
    experience = Experience.find_by(code: code)

    if experience.nil?
      render json: { type: 'error', error: "Invalid experience code" }, status: :not_found
      return
    end

    if current_user && experience.user_registered?(current_user)
      render json: {
        type: 'success',
        url: generate_experience_path(experience.code),
        status: "registered"
      }
    else
      render json: {
        type: 'needs_registration',
        experience_code: code,
        status: "needs_registration",
        url: "/experiences/#{experience.code}/register"
      }
    end
  end

  # POST /api/experiences/register
  # Handles user registration for an experience
  def register
    experience = Experience.find_by(code: register_params[:code])

    if experience.nil?
      render json: { type: 'error', error: "Invalid experience code" }, status: :not_found
      return
    end

    authorize! experience, to: :register?

    user = current_user

    if user.nil?
      user = User.find_or_create_by(email: register_params[:email]) do |u|
        u.name = register_params[:name] if register_params[:name].present?
      end

      sign_in(create_passwordless_session(user))
    else
      # Update name if provided
      user.update(name: register_params[:name]) if register_params[:name].present?
    end

    if user.nil?
      render json: { type: 'error', error: "Failed to create user account" }, status: :internal_server_error
      return
    end

    unless experience.user_registered?(user)
      experience.register_user(user)
    end

    render json: {
      type: 'success',
      jwt: experience.jwt_for_participant(user),
      url: generate_experience_path(experience.code),
      status: "registered"
    }
  end

  private

  def experience_code
    %w[experience_id id code]
      .map { |k| params[k] }
      .compact
      .first
      &.to_s
      &.strip
  end

  def join_params
    params.require(:code)
  end

  def register_params
    params.permit(:code, :email, :name)
  end

  def generate_experience_path(code)
    "/experiences/#{code}"
  end
end
