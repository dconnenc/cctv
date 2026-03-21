class Api::UsersController < Api::BaseController
  def me
    if current_user
      render json: current_user.as_json(methods: [:most_recent_participant_name, :most_recent_avatar])
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

  def following
    if current_user
      performers = current_user.followed_performers
                               .includes(photo_attachment: :blob)
                               .order(name: :asc)

      render json: {
        type: 'success',
        success: true,
        performers: performers.map { |p| PerformerSerializer.serialize_summary(p, current_user: current_user) }
      }
    else
      render json: { type: 'error', success: false, message: "Not authenticated" }, status: :unauthorized
    end
  end
end
