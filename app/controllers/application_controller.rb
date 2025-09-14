class ApplicationController < ActionController::Base
  include Passwordless::ControllerHelpers
  include ActionPolicy::Controller

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  def index
    render 'layouts/application'
  end

  helper_method :current_user
  def current_user
    @current_user ||= authenticate_by_session(User)
  end
end
