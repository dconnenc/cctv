class AdminSessionsController < ApplicationController
  include Passwordless::ControllerHelpers

  # Admin auto-login: bypass email, sign in directly or reject
  def create
    user = User.find_by("lower(email) = ?", params[:email].downcase.strip)

    if user&.admin? || user&.superadmin?
      sign_in(create_passwordless_session(user))
      redirect_to root_path
    else
      redirect_to users_sign_in_path, alert: "Invalid credentials"
    end
  end
end
