class Api::ExperienceBlocksController < Api::BaseController
  before_action :authenticate_and_set_user_and_experience

  def create_params
    permitted = params.require(:block).permit(
      :kind,
      :status,
      visible_to_roles: [],
      visible_to_segments: [],
      target_user_ids: []
    )
    
    permitted[:payload] = params[:block][:payload] if params[:block][:payload]
    permitted[:variables] = params[:block][:variables] if params[:block][:variables]
    
    permitted
  end

  # POST /api/experiences/:experience_id/blocks
  def create
    with_experience_orchestration do
      orchestrator = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      )

      block = if create_params[:variables].present?
        orchestrator.add_block_with_dependencies!(
          kind: create_params[:kind],
          payload: create_params[:payload] || {},
          visible_to_roles: create_params[:visible_to_roles] || [],
          visible_to_segments: create_params[:visible_to_segments] || [],
          target_user_ids: create_params[:target_user_ids] || [],
          status: create_params[:status] || :hidden,
          variables: create_params[:variables] || []
        )
      else
        orchestrator.add_block!(
          kind: create_params[:kind],
          payload: create_params[:payload] || {},
          visible_to_roles: create_params[:visible_to_roles] || [],
          visible_to_segments: create_params[:visible_to_segments] || [],
          target_user_ids: create_params[:target_user_ids] || [],
          status: create_params[:status] || :hidden,
          open_immediately: create_params[:open_immediately] || false
        )
      end

      Experiences::Broadcaster.new(@experience).broadcast_experience_update

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

      Experiences::Broadcaster.new(@experience).broadcast_experience_update

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

      Experiences::Broadcaster.new(@experience).broadcast_experience_update

      render json: {
        success: true,
        data: block,
      }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/hide
  def hide
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).hide_block!(params[:id])

      Experiences::Broadcaster.new(@experience).broadcast_experience_update

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
      updated_block = Experiences::Visibility.serialize_block_for_user(
        experience: @experience,
        user: @user,
        block: block
      )

      Experiences::Broadcaster.new(@experience).broadcast_experience_update

      render json: {
        success: true,
        data: {
          submission: submission,
          block: updated_block
        },
      }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/submit_question_response
  def submit_question_response
    with_experience_orchestration do
      block = @experience.experience_blocks.find(params[:id])

      submission = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).submit_question_response!(
        block_id: params[:id],
        answer: params[:answer]
      )

      # Get updated block with response data
      updated_block = Experiences::Visibility.serialize_block_for_user(
        experience: @experience,
        user: @user,
        block: block
      )

      Experiences::Broadcaster.new(@experience).broadcast_experience_update

      render json: {
        success: true,
        data: {
          submission: submission,
          block: updated_block
        },
      }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/submit_multistep_form_response
  def submit_multistep_form_response
    with_experience_orchestration do
      block = @experience.experience_blocks.find(params[:id])

      submission = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).submit_multistep_form_response!(
        block_id: params[:id],
        answer: params[:answer]
      )

      # Get updated block with response data
      updated_block = Experiences::Visibility.serialize_block_for_user(
        experience: @experience,
        user: @user,
        block: block
      )

      render json: {
        success: true,
        data: {
          submission: submission,
          block: updated_block
        },
      }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/submit_mad_lib_response
  def submit_mad_lib_response
    with_experience_orchestration do
      block = @experience.experience_blocks.find(params[:id])

      submission = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).submit_mad_lib_response!(
        block_id: params[:id],
        answer: params[:answer]
      )

      # Get updated block with response data
      updated_block = Experiences::Visibility.serialize_block_for_user(
        experience: @experience,
        user: @user,
        block: block
      )

      Experiences::Broadcaster.new(@experience).broadcast_experience_update

      render json: {
        success: true,
        data: {
          submission: submission,
          block: updated_block
        },
      }, status: 200
    end
  end
end
