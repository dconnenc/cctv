class Api::UsersController < Api::BaseController
  def me
    if current_user
      render json: current_user
    else
      render json: {}, status: :ok
    end
  end
end
