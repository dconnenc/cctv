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
        code: params[:experience][:code],
        description: params[:experience][:description]
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

      Experiences::Broadcaster.new(@experience).broadcast_experience_update

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

      Experiences::Broadcaster.new(@experience).broadcast_experience_update

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

      Experiences::Broadcaster.new(@experience).broadcast_experience_update

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

      Experiences::Broadcaster.new(@experience).broadcast_experience_update

      render json: {
        success: true,
        data: @experience,
      }, status: :ok
    end
  end

  # GET /api/experiences/:id
  def show
    authenticated_user, experience = authenticate_for_experience_show
    return unless authenticated_user && experience # Early return if authentication failed

    authorize! experience, to: :show?

    visibility_payload = Experiences::Visibility.payload_for_user(experience: experience, user: authenticated_user)

    # Find current user's participant record for this experience
    current_participant = authenticated_user ? experience.experience_participants.find_by(user: authenticated_user) : nil

    render json: ExperienceSerializer.serialize_for_api_response(
      experience,
      visibility_payload: visibility_payload,
      current_participant: current_participant
    )
  end

  # GET /api/experiences/:id/preview
  def preview
    authenticated_user, experience = authenticate_for_experience_show
    return unless authenticated_user && experience

    authorize! experience, to: :manage?

    participant_id = params[:participant_id]
    target_participant = if participant_id.present?
      experience.experience_participants.find_by(id: participant_id)
    else
      experience.experience_participants.first
    end

    unless target_participant
      render json: {
        type: 'error',
        error: 'Participant not found'
      }, status: :not_found
      return
    end

    tv_payload = Experiences::Visibility.payload_for_tv(
      experience: experience
    )

    participant_payload = Experiences::Visibility.payload_for_user(
      experience: experience,
      user: target_participant.user
    )

    admin_payload = Experiences::Visibility.payload_for_user(
      experience: experience,
      user: authenticated_user
    )

    render json: {
      type: 'success',
      success: true,
      tv_view: tv_payload[:experience],
      participant_view: participant_payload[:experience],
      all_blocks: admin_payload[:experience]
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

  # Authenticate user for experience show - handles both JWT and session auth
  # Returns [user, experience] or renders error and returns nil
  def authenticate_for_experience_show
    if bearer_token
      authenticate_with_jwt_for_show
    else
      authenticate_with_session_for_show
    end
  end

  def authenticate_with_jwt_for_show
    claims = Experiences::AuthService.decode!(bearer_token)

    case claims[:scope]
    when Experiences::AuthService::PARTICIPANT
      authorize_participant_for_show(claims)
    when Experiences::AuthService::ADMIN
      authorize_admin_for_show(claims)
    else
      render json: { type: 'error', error: "Invalid token scope" }, status: :unauthorized
      nil
    end
  rescue Experiences::AuthService::TokenInvalid, Experiences::AuthService::TokenExpired
    render json: { type: 'error', error: "Invalid or expired token" }, status: :unauthorized
    nil
  rescue Experiences::AuthService::Unauthorized, Experiences::AuthService::NotFound => e
    render json: { type: 'error', error: e.message }, status: :unauthorized
    nil
  end

  def authorize_participant_for_show(claims)
    user, experience = Experiences::AuthService.authorize_participant!(claims)

    # Verify experience code matches URL parameter
    if params[:id] != experience.code
      render json: { type: 'error', error: "Experience mismatch" }, status: :unauthorized
      return nil
    end

    [user, experience]
  end

  def authorize_admin_for_show(claims)
    user = Experiences::AuthService.admin_from_claims!(claims)
    experience = find_experience_by_code_or_render_error(params[:id])

    return nil unless experience
    [user, experience]
  end

  def authenticate_with_session_for_show
    experience = find_experience_by_code_or_render_error(params[:id])
    return nil unless experience

    [current_user, experience]
  end

  def find_experience_by_code_or_render_error(code)
    experience = Experience.find_by(code: code)

    if experience.nil?
      render json: { type: 'error', error: "Invalid experience code" }, status: :not_found
      return nil
    end

    experience
  end
end
