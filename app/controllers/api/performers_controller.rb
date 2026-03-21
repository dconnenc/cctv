class Api::PerformersController < Api::BaseController
  authorize :user, through: :current_user

  # GET /api/performers
  def index
    authorize! Performer, to: :index?

    performers = Performer.ordered.includes(photo_attachment: :blob)

    render json: {
      type: 'success',
      success: true,
      performers: performers.map { |p| PerformerSerializer.serialize_summary(p, current_user: current_user) }
    }
  end

  # GET /api/performers/:slug
  def show
    performer = Performer.includes(photo_attachment: :blob).find_by!(slug: params[:slug])

    authorize! performer, to: :show?

    render json: {
      type: 'success',
      success: true,
      performer: PerformerSerializer.serialize(performer, current_user: current_user, include_events: true)
    }
  rescue ActiveRecord::RecordNotFound
    render json: { type: 'error', success: false, message: "Performer not found" }, status: :not_found
  end

  # POST /api/performers
  def create
    authorize! Performer, to: :create?

    if current_user.performer.present?
      render json: {
        type: 'error',
        success: false,
        message: "You already have a performer profile"
      }, status: :unprocessable_entity
      return
    end

    performer = current_user.build_performer(performer_params)

    if performer.save
      performer.photo.attach(params[:photo]) if params[:photo].present?

      render json: {
        type: 'success',
        success: true,
        performer: PerformerSerializer.serialize(performer, current_user: current_user)
      }, status: :created
    else
      render json: {
        type: 'error',
        success: false,
        message: "Failed to create performer profile",
        error: performer.errors.full_messages.to_sentence
      }, status: :unprocessable_entity
    end
  end

  # PATCH /api/performers/:slug
  def update
    performer = Performer.find_by!(slug: params[:slug])

    authorize! performer, to: :update?

    if performer.update(performer_params)
      performer.photo.attach(params[:photo]) if params[:photo].present?

      render json: {
        type: 'success',
        success: true,
        performer: PerformerSerializer.serialize(performer, current_user: current_user)
      }
    else
      render json: {
        type: 'error',
        success: false,
        message: "Failed to update performer profile",
        error: performer.errors.full_messages.to_sentence
      }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { type: 'error', success: false, message: "Performer not found" }, status: :not_found
  end

  # DELETE /api/performers/:slug
  def destroy
    performer = Performer.find_by!(slug: params[:slug])

    authorize! performer, to: :destroy?

    performer.destroy!

    render json: { type: 'success', success: true, message: "Performer profile deleted" }
  rescue ActiveRecord::RecordNotFound
    render json: { type: 'error', success: false, message: "Performer not found" }, status: :not_found
  end

  # POST /api/performers/:slug/follow
  def follow
    performer = Performer.find_by!(slug: params[:slug])

    authorize! Follow, to: :create?

    follow = current_user.follows.find_or_create_by!(performer: performer)

    render json: {
      type: 'success',
      success: true,
      message: "Now following #{performer.name}",
      follower_count: performer.follower_count
    }
  rescue ActiveRecord::RecordNotFound
    render json: { type: 'error', success: false, message: "Performer not found" }, status: :not_found
  end

  # DELETE /api/performers/:slug/follow
  def unfollow
    performer = Performer.find_by!(slug: params[:slug])

    authorize! Follow, to: :destroy?

    current_user.follows.find_by(performer: performer)&.destroy

    render json: {
      type: 'success',
      success: true,
      message: "Unfollowed #{performer.name}",
      follower_count: performer.follower_count
    }
  rescue ActiveRecord::RecordNotFound
    render json: { type: 'error', success: false, message: "Performer not found" }, status: :not_found
  end

  private

  def performer_params
    params.permit(:name, :bio)
  end
end
