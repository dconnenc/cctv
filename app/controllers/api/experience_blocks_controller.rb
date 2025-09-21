class Api::ExperienceBlocksController < Api::BaseController
  before_action :authenticate_and_set_user_and_experience

  # POST /api/experiences/:experience_id/blocks
  def create
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).add_block!(
        kind: params[:experience][:kind],
        payload:  params[:experience][:payload] || {},
        visible_to_roles:  params[:experience][:visible_to_roles] || [],
        visible_to_segments: params[:experience][:visible_to_segments] || [],
        target_user_ids:  params[:experience][:target_user_ids] || [],
        status:  params[:experience][:status] || :hidden,
        open_immediately:  params[:experience][:open_immediately] || false
      )

      render json: {
        success: true,
        data: block,
      }, status: 200
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
      }, status: 200
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
      }, status: 200
    end
  end
end
