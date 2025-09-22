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

  # PATCH /api/experiences/:experience_id/blocks/:id
  def update
    render json: {
      success: true,
      data: block,
    }, status: 200
  end

  # POST /api/experiences/:experience_id/blocks/:id/open
  def open
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).open_block!(params[:id])

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
      ).close_block!(params[:id])

      render json: {
        success: true,
        data: block,
      }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/submit_poll_response
  def submit_poll_response
    with_experience_orchestration do
      block = @experience.experience_blocks.find(params[:id])

      submission = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).submit_poll_response!(
        block_id: params[:id],
        answer: params[:answer]
      )

      # Get updated block with response data
      visibility = Experiences::Visibility.new(experience: @experience, user: @user)
      role, segments = visibility.send(:participant_role_and_segments)
      updated_block = visibility.send(:serialize_block, block, role)

      render json: {
        success: true,
        data: {
          submission: submission,
          block: updated_block
        },
      }, status: 200
    end
  end

  private

  def experience_code
    %w[experience_id code]
      .map { |k| params[k] }
      .compact
      .first
      &.to_s
      &.strip
  end
end
