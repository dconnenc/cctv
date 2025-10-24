class Api::ExperiencesController < Api::BaseController
  authorize :user, through: :current_user
  before_action :authenticate_and_set_user_and_experience,
    only: [:open_lobby, :start, :pause, :resume, :admin_token]

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
            code_slug: experience.code_slug,
            created_at: experience.created_at,
            url: generate_experience_path(experience.code_slug)
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

  # POST /api/experiences/:id/admin_token
  def admin_token
    authorize! @experience, to: :manage?

    jwt = Experiences::AuthService.jwt_for_admin(user: @user)

    render json: {
      type: 'success',
      success: true,
      jwt: jwt
    }, status: :ok
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

  # POST /api/experiences/join
  # Handles code submission - checks if user exists and is registered
  def join
    code = join_params
    # Allow lookup by code (as entered by user)
    experience = Experience.find_by_code(code)

    if experience.nil?
      render json: { type: 'error', error: "Invalid experience code" }, status: :not_found
      return
    end

    if current_user && experience.user_registered?(current_user)
      render json: {
        type: 'success',
        url: generate_experience_path(experience.code_slug),
        status: "registered"
      }
    else
      render json: {
        type: 'needs_registration',
        experience_code: code,
        status: "needs_registration",
        url: "/experiences/#{experience.code_slug}/register"
      }
    end
  end

  # GET /api/experiences/:id/registration_info
  # Public endpoint - returns minimal metadata needed for registration page
  def registration_info
    experience = Experience.find_by(code_slug: params[:id])

    if experience.nil?
      render json: { type: 'error', error: "Experience not found" }, status: :not_found
      return
    end

    render json: {
      type: 'success',
      experience: {
        name: experience.name,
        code: experience.code,
        code_slug: experience.code_slug,
        description: experience.description,
        join_open: experience.join_open
      }
    }
  end

  # POST /api/experiences/:id/register
  # Handles user registration for an experience
  # Uses :id param from route (slug) to find experience
  def register
    experience = Experience.find_by(code_slug: params[:id])

    if experience.nil?
      render json: { type: 'error', error: "Experience not found" }, status: :not_found
      return
    end

    authorize! experience, to: :register?

    unless register_params[:participant_name].present?
      render json: { type: 'error', error: "Name is required" }, status: :unprocessable_entity
      return
    end

    user = current_user

    if user.nil?
      # Security check: prevent anyone from entering an admin email and auto-logging in as admin
      existing_user = User.find_by(email: register_params[:email])
      if existing_user && (existing_user.admin? || existing_user.superadmin?)
        render json: { type: 'error', error: "This email is already registered. Please sign in first." }, status: :forbidden
        return
      end

      # Find or create user
      user = User.find_by(email: register_params[:email])

      if user
        # Existing user registering for a new experience
        # Don't update user.name - keep their existing name
        # The participant_name will be used for the experience_participant record
      else
        # New user - use participant_name for the user record
        user = User.create!(
          email: register_params[:email],
          name: register_params[:participant_name]
        )
      end

      sign_in(create_passwordless_session(user))
    end
    # If user is already logged in (current_user exists), don't modify their user.name

    unless experience.user_registered?(user)
      experience.register_user(user, name: register_params[:participant_name])
    end

    render json: {
      type: 'success',
      jwt: experience.jwt_for_participant(user),
      url: generate_experience_path(experience.code_slug),
      status: "registered"
    }
  end

  private

  def join_params
    params.require(:code)
  end

  def register_params
    params.permit(:email, :name, :participant_name)
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

    # Verify experience slug matches URL parameter
    if params[:id] != experience.code_slug
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

  def find_experience_by_code_or_render_error(slug)
    # Find by URL-safe slug
    experience = Experience.find_by(code_slug: slug)

    if experience.nil?
      render json: { type: 'error', error: "Experience not found" }, status: :not_found
      return nil
    end

    experience
  end
end
