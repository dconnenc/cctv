class Api::ExperienceBlocksController < Api::BaseController
  before_action :authorize_and_set_user_and_experience

  # POST /api/experiences/:experience_id/blocks
  def create
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).add_block!

      render json: {
        success: true,
        data: block,
      }, status: :success
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/open
  def open
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).open_block!

      render json: {
        success: true,
        data: block,
      }, status: :success
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/close
  def close
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).close_block!

      render json: {
        success: true,
        data: block,
      }, status: :success
    end
  end
end
