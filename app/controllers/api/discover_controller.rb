class Api::DiscoverController < Api::BaseController
  authorize :user, through: :current_user
  requires_feature :discover

  # GET /api/discover
  def index
    authorize! Event, to: :index?

    render json: {
      type: "success",
      success: true,
      **Discovery::Feed.call
    }
  end
end
