class Api::ExperiencesController < Api::BaseController
  before_action :authenticate_and_set_user_and_experience,
    only: [
      :open_lobby,
      :start,
      :pause,
      :resume,
      :admin_token,
      :clear_avatars,
      :update_playbill
    ]

  before_action -> { authorize! Experience, to: :create? }, only: [:create]
  before_action :authorize_experience_action!, only: [:open_lobby, :start, :pause, :resume]
  before_action -> { authorize! @experience, to: :manage? }, only: [:admin_token, :clear_avatars, :update_playbill]

  after_action :verify_authorized, except: [:join, :registration_info]

  # POST /api/experiences
  def create
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
            url: experience_lobby_url(code: experience.code_slug)
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

  # POST /api/experiences/:id/clear_avatars
  def clear_avatars
    ExperienceParticipant.where(experience_id: @experience.id).update_all(avatar: {})

    Experiences::Broadcaster.new(@experience).broadcast_experience_update

    ActionCable.server.broadcast(
      Experiences::Broadcaster.monitor_stream_key(@experience),
      { type: 'drawing_update', participant_id: nil, operation: 'clear_all' },
    )

    render json: { success: true }
  end

  # PATCH /api/experiences/:id/update_playbill
  def update_playbill
    @experience.playbill = params[:playbill] || []
    @experience.playbill_enabled = params[:playbill_enabled] unless params[:playbill_enabled].nil?

    if @experience.save
      (params[:playbill] || []).each do |section|
        next unless section[:image_signed_id].present?

        blob = ActiveStorage::Blob.find_signed(section[:image_signed_id])
        next unless blob
        next if @experience.attachments.where(blob_id: blob.id).exists?

        @experience.attachments.attach(blob)
      end

      Experiences::Broadcaster.new(@experience).broadcast_experience_update
      render json: { success: true }
    else
      render json: { success: false, error: @experience.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  # POST /api/experiences/:id/admin_token
  def admin_token
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

    participant = experience.experience_participants.find_by(user: authenticated_user)

    payload = if authenticated_user.admin? || authenticated_user.superadmin?
      Experiences::Visibility.for_admin(experience)
    elsif participant
      Experiences::Visibility.for_participant(experience, participant)
    else
      Experiences::Visibility.for_admin(experience)
    end

    render json: payload
  end

  # POST /api/experiences/join
  def join
    code = join_params
    experience = Experience.find_by_code_or_slug(code)

    if experience.nil?
      render json: { type: 'error', error: "Invalid experience code" }, status: :not_found
      return
    end

    if current_user && experience.user_registered?(current_user)
      render json: {
        type: 'success',
        url: experience_lobby_path(code: experience.code_slug),
        status: "registered",
        experience_name: experience.name,
        experience_code_slug: experience.code_slug
      }
    else
      render json: {
        type: 'needs_registration',
        experience_code: code,
        status: "needs_registration",
        url: experience_register_path(code: experience.code_slug),
        experience_name: experience.name,
        experience_code_slug: experience.code_slug
      }
    end
  end

  # GET /api/experiences/:id/registration_info
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
      existing_user = User.find_by(email: register_params[:email])
      if existing_user && (existing_user.admin? || existing_user.superadmin?)
        render json: { type: 'error', error: "This email is already registered. Please sign in first." }, status: :forbidden
        return
      end

      user = User.find_by(email: register_params[:email])

      if user
        # Existing user registering for a new experience
      else
        user = User.create!(
          email: register_params[:email],
          name: register_params[:participant_name]
        )
      end

      sign_in(create_passwordless_session(user))
    end

    unless experience.user_registered?(user)
      experience.register_user(user, name: register_params[:participant_name])

      Experiences::Broadcaster.new(experience).broadcast_experience_update
    end

    render json: {
      type: 'success',
      jwt: experience.jwt_for_participant(user),
      url: experience_lobby_path(code: experience.code_slug),
      status: "registered"
    }
  end

  private

  def authorize_experience_action!
    authorize! @experience, to: :"#{action_name}?"
  end

  def join_params
    params.require(:code)
  end

  def register_params
    params.permit(:email, :name, :participant_name)
  end

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
    experience = Experience.find_by(code_slug: slug)

    if experience.nil?
      render json: { type: 'error', error: "Experience not found" }, status: :not_found
      return nil
    end

    experience
  end
end
