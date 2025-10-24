class Api::UsersController < Api::BaseController
  def me
    if current_user
      render json: current_user.as_json(methods: [:most_recent_participant_name])
    else
      render json: {}, status: :ok
    end
  end

  def sign_out_user
    if current_user
      sign_out(User)
    end

    render json: { success: true }, status: :ok
  end
end
