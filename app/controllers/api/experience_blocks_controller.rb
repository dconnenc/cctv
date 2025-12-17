class Api::ExperienceBlocksController < Api::BaseController
  before_action :authenticate_and_set_user_and_experience


  # POST /api/experiences/:experience_id/blocks
  def create
    with_experience_orchestration do
      orchestrator = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      )

      block = if create_params[:variables].present? || create_params[:questions].present?
        orchestrator.add_block_with_dependencies!(
          kind: create_params[:kind],
          payload: create_params[:payload] || {},
          visible_to_roles: create_params[:visible_to_roles] || [],
          visible_to_segments: create_params[:visible_to_segments] || [],
          target_user_ids: create_params[:target_user_ids] || [],
          status: create_params[:status] || :hidden,
          variables: create_params[:variables] || [],
          questions: create_params[:questions] || []
        )
      else
        orchestrator.add_block!(
          kind: create_params[:kind],
          payload: create_params[:payload] || {},
          visible_to_roles: create_params[:visible_to_roles] || [],
          visible_to_segments: create_params[:visible_to_segments] || [],
          target_user_ids: create_params[:target_user_ids] || [],
          status: create_params[:status] || :hidden,
          open_immediately: create_params[:open_immediately] || false,
          show_in_lobby: create_params[:show_in_lobby] || false
        )
      end

      # If this is a child block being added to a Family Feud parent, broadcast granular update
      if create_params[:parent_block_id].present?
        parent_block = @experience.experience_blocks.find_by(id: create_params[:parent_block_id])
        if parent_block&.kind == 'family_feud'
          bucket_config = parent_block.payload['bucket_configuration']&.dig('buckets') || []
          
          Experiences::Broadcaster.new(@experience).broadcast_family_feud_update(
            block_id: parent_block.id,
            operation: 'question_added',
            data: {
              question: {
                questionId: block.id,
                questionText: block.payload['question'] || 'Question',
                buckets: bucket_config.map { |b| 
                  { id: b['id'], name: b['name'], answers: [] }
                },
                unassignedAnswers: []
              }
            }
          )
        end
      end

      @experience.reload
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

      # If this is a Family Feud child question, broadcast granular update
      parent_block = block.parent_block
      if parent_block&.kind == 'family_feud'
        Experiences::Broadcaster.new(@experience).broadcast_family_feud_update(
          block_id: parent_block.id,
          operation: 'answer_received',
          data: {
            questionId: block.id,
            answer: {
              id: submission.id,
              text: params[:answer].is_a?(String) ? params[:answer] : params[:answer].to_s,
              userId: @user.id,
              userName: @user.name || 'User'
            }
          }
        )
      end

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

  # POST /api/experiences/:experience_id/blocks/:id/family_feud/add_bucket
  def add_bucket
    with_experience_orchestration do
      block = @experience.experience_blocks.find(params[:id])

      bucket = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).add_family_feud_bucket!(
        block_id: params[:id],
        name: params[:name] || "New Bucket"
      )

      broadcaster = Experiences::Broadcaster.new(@experience)
      
      broadcaster.broadcast_family_feud_update(
        block_id: params[:id],
        operation: 'bucket_added',
        data: { bucket: bucket }
      )
      
      broadcaster.broadcast_experience_update

      render json: { success: true, data: { bucket: bucket } }, status: 200
    end
  end

  # PATCH /api/experiences/:experience_id/blocks/:id/family_feud/buckets/:bucket_id
  def rename_bucket
    with_experience_orchestration do
      block = @experience.experience_blocks.find(params[:id])

      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).rename_family_feud_bucket!(
        block_id: params[:id],
        bucket_id: params[:bucket_id],
        name: params[:name]
      )

      broadcaster = Experiences::Broadcaster.new(@experience)
      
      broadcaster.broadcast_family_feud_update(
        block_id: params[:id],
        operation: 'bucket_renamed',
        data: { bucket_id: params[:bucket_id], name: params[:name] }
      )
      
      broadcaster.broadcast_experience_update

      render json: { success: true }, status: 200
    end
  end

  # DELETE /api/experiences/:experience_id/blocks/:id/family_feud/buckets/:bucket_id
  def delete_bucket
    with_experience_orchestration do
      block = @experience.experience_blocks.find(params[:id])

      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).delete_family_feud_bucket!(
        block_id: params[:id],
        bucket_id: params[:bucket_id]
      )

      broadcaster = Experiences::Broadcaster.new(@experience)
      
      broadcaster.broadcast_family_feud_update(
        block_id: params[:id],
        operation: 'bucket_deleted',
        data: { bucket_id: params[:bucket_id] }
      )
      
      broadcaster.broadcast_experience_update

      render json: { success: true }, status: 200
    end
  end

  # PATCH /api/experiences/:experience_id/blocks/:id/family_feud/answers/:answer_id/bucket
  def assign_answer
    with_experience_orchestration do
      block = @experience.experience_blocks.find(params[:id])

      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).assign_family_feud_answer!(
        block_id: params[:id],
        answer_id: params[:answer_id],
        bucket_id: params[:bucket_id]
      )

      broadcaster = Experiences::Broadcaster.new(@experience)
      
      broadcaster.broadcast_family_feud_update(
        block_id: params[:id],
        operation: 'answer_assigned',
        data: { 
          answer_id: params[:answer_id],
          bucket_id: params[:bucket_id]
        }
      )
      
      broadcaster.broadcast_experience_update

      render json: { success: true }, status: 200
    end
  end

  private

  def create_params
    permitted = params.require(:block).permit(
      :kind,
      :status,
      :open_immediately,
      :show_in_lobby,
      visible_to_roles: [],
      visible_to_segments: [],
      target_user_ids: []
    )

    permitted[:payload] = params[:block][:payload] if params[:block][:payload]
    permitted[:variables] = params[:block][:variables] if params[:block][:variables]
    permitted[:questions] = params[:block][:questions] if params[:block][:questions]

    permitted
  end
end
