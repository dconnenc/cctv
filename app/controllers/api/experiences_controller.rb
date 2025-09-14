class Api::ExperiencesController < Api::BaseController
  skip_before_action :verify_authenticity_token

  # POST /api/experiences
  def create
    authorize! Experience, to: :create?

    valid, message = Experience.validate_code(experience_params[:code])

    if valid
      experience = current_user.created_experiences.build(experience_params)

      if experience.save
        render json: {
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
          success: false,
          message: "Failed to create experience",
          error: experience.errors.full_messages.to_sentence
        }, status: :unprocessable_entity
      end
    else
      render json: {
        success: false,
        message: "Invalid experience code",
        error: message
      }, status: :unprocessable_entity
    end
  end

  # GET /api/experiences/:id
  def show
    experience = Experience.find_by(code: params[:id])

    if experience.nil?
      render json: { error: "Invalid experience code" }, status: :not_found
      return
    end

    authorize! experience, to: :show?

    render json: {
      success: true,
      experience: {
        id: experience.id,
        code: experience.code,
        status: 'lobby',
        participants: experience.users.map do |user|
          {
            id: user.id,
            name: user.name,
            email: user.email
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
      render json: { error: "Invalid experience code" }, status: :not_found
      return
    end

    if current_user && experience.user_registered?(current_user)
      render json: {
        jwt: experience.jwt_token_for(current_user),
        url: generate_experience_path(experience.code),
        status: "registered"
      }
    else
      render json: {
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
      render json: { error: "Invalid experience code" }, status: :not_found
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
      render json: { error: "Failed to create user account" }, status: :internal_server_error
      return
    end

    unless experience.user_registered?(user)
      experience.register_user(user)
    end

    render json: {
      jwt: experience.jwt_token_for(user),
      url: generate_experience_path(experience.code),
      status: "registered"
    }
  end

  private

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
