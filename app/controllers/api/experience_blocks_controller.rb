class Api::ExperienceBlocksController < Api::BaseController
  MANAGEMENT_ACTIONS = %i[
    create update destroy reorder set_column open close hide detach_from_parent clear_buzzer_responses
    add_bucket rename_bucket delete_bucket assign_answer auto_categorize generate_synthetic_answers update_ai_context update_question_ai_context
    start_playing reveal_bucket show_x set_theme_music restart_theme_music next_question restart_playing
    restart_categorizing restart_everything
    start_guess_who reroll_guess_who_mystery curate_guess_who_clues
    advance_guess_who_clue set_guess_who_monitor_view
    dispatch_guess_who_poll conclude_guess_who_poll reveal_guess_who
    set_guess_who_theme_music restart_guess_who_theme_music
    start_minigame_arithmetic end_minigame_arithmetic restart_minigame_arithmetic
    start_minigame_balloon_pump end_minigame_balloon_pump restart_minigame_balloon_pump
    start_collaborative_drawing_round end_collaborative_drawing_round restart_collaborative_drawing
    start_the_scene end_the_scene force_next_the_scene update_the_scene_performers
    clear_the_scene_top clear_the_scene_suggestion clear_the_scene_all
  ].freeze

  SUBMISSION_ACTIONS = %i[
    submit_poll_response submit_question_response
    submit_photo_upload_response submit_buzzer_response
    submit_minigame_arithmetic_response submit_minigame_balloon_pump_update
    submit_collaborative_drawing_photo submit_collaborative_drawing
    submit_the_scene_suggestion submit_the_scene_vote press_the_scene_buzzer
  ].freeze

  before_action :authenticate_and_set_user_and_experience
  before_action -> { authorize! @experience, to: :manage_blocks? }, only: MANAGEMENT_ACTIONS
  before_action :set_block, except: [:create]
  before_action :authorize_block_submission!, only: SUBMISSION_ACTIONS

  after_action :verify_authorized

  # POST /api/experiences/:experience_id/blocks
  def create
    with_experience_orchestration do
      orchestrator = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      )

      segment_ids = create_params[:visible_to_segment_ids] || []

      block = if create_params[:questions].present?
        orchestrator.add_block_with_dependencies!(
          kind: create_params[:kind],
          payload: create_params[:payload] || {},
          visible_to_roles: create_params[:visible_to_roles] || [],
          target_user_ids: create_params[:target_user_ids] || [],
          status: create_params[:status] || :hidden,
          questions: create_params[:questions] || [],
          add_to_playbill: create_params[:add_to_playbill] || false,
          playbill_mysterious: create_params[:playbill_mysterious] || false
        )
      else
        orchestrator.add_block!(
          kind: create_params[:kind],
          payload: create_params[:payload] || {},
          visible_to_roles: create_params[:visible_to_roles] || [],
          target_user_ids: create_params[:target_user_ids] || [],
          status: create_params[:status] || :hidden,
          open_immediately: create_params[:open_immediately] || false,
          show_in_lobby: create_params[:show_in_lobby] || false,
          add_to_playbill: create_params[:add_to_playbill] || false,
          playbill_mysterious: create_params[:playbill_mysterious] || false
        )
      end

      if segment_ids.any?
        ExperienceBlockSegment.insert_all(
          segment_ids.map { |sid| { experience_block_id: block.id, experience_segment_id: sid } }
        )
      end

      if create_params[:parent_block_id].present?
        parent_block = @experience.experience_blocks.find_by(id: create_params[:parent_block_id])
        if parent_block&.kind == 'family_feud'
          Experiences::Broadcaster.new(@experience).broadcast_family_feud_update(
            block_id: parent_block.id,
            operation: 'question_added',
            data: {
              question: {
                questionId: block.id,
                questionText: block.payload['question'] || 'Question',
                buckets: [],
                unassignedAnswers: []
              }
            }
          )
        end
      end

      @experience.reload
      Experiences::Broadcaster.enqueue_update(@experience)

      track_event(Analytics::Events::BLOCK_CREATED, block_id: block.id, block_kind: block.kind)

      render json: {
        success: true,
        data: block,
      }, status: 200
    end
  end

  # PATCH /api/experiences/:experience_id/blocks/:id
  def update
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(experience: @experience, actor: @user)
        .update_block!(
          block: @block,
          payload: update_params[:payload] || {},
          visible_to_segment_ids: update_params[:visible_to_segment_ids] || [],
          questions: update_params[:questions]
        )

      @experience.reload
      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: block }, status: 200
    end
  end

  # DELETE /api/experiences/:experience_id/blocks/:id
  def destroy
    with_experience_orchestration do
      Experiences::Orchestrator.new(experience: @experience, actor: @user)
        .delete_block!(params[:id])

      @experience.reload
      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/reorder
  def reorder
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).reorder_block!(
        block: @block,
        position: params[:position].to_i
      )

      @experience.reload
      Experiences::Broadcaster.enqueue_update(@experience)

      render json: {
        success: true,
        data: block,
      }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/set_column
  def set_column
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).set_block_column!(
        block: @block,
        column: params[:column].to_i
      )

      @experience.reload
      Experiences::Broadcaster.enqueue_update(@experience)

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
      ).open_block!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      track_event(Analytics::Events::BLOCK_OPENED, block_id: block.id, block_kind: block.kind)

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
      ).close_block!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      track_event(Analytics::Events::BLOCK_CLOSED, block_id: block.id, block_kind: block.kind)

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
      ).hide_block!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: {
        success: true,
        data: block,
      }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/detach_from_parent
  def detach_from_parent
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).detach_block_from_parent!(params[:id])

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: block }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/submit_poll_response
  def submit_poll_response
    with_experience_orchestration do
      orchestrator = Experiences::Orchestrator.new(experience: @experience, actor: @user)
      submission = orchestrator.submit_poll_response!(block: @block, answer: params[:answer])

      Experiences::Broadcaster.new(@experience).broadcast_profile_changes(
        profile_changes: orchestrator.profile_changes
      )
      Experiences::Broadcaster.enqueue_update(@experience)

      track_event(Analytics::Events::RESPONSE_SUBMITTED, block_id: @block.id, block_kind: @block.kind, response_kind: "poll")

      render json: { success: true, submission: { id: submission.id, answer: submission.answer } }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/submit_question_response
  def submit_question_response
    with_experience_orchestration do
      submission = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).submit_question_response!(
        block: @block,
        answer: params[:answer]
      )

      parent_block = @block.parent_block
      if parent_block&.kind == 'family_feud'
        Experiences::Broadcaster.new(@experience).broadcast_family_feud_update(
          block_id: parent_block.id,
          operation: 'answer_received',
          data: {
            questionId: @block.id,
            answer: {
              id: submission.id,
              text: params[:answer].is_a?(String) ? params[:answer] : params[:answer].to_s,
              userId: @user.id,
              userName: @user.name || 'User'
            }
          }
        )
      end

      Experiences::Broadcaster.enqueue_update(@experience)

      track_event(Analytics::Events::RESPONSE_SUBMITTED, block_id: @block.id, block_kind: @block.kind, response_kind: "question")

      render json: { success: true, submission: { id: submission.id, answer: submission.answer } }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/submit_buzzer_response
  def submit_buzzer_response
    with_experience_orchestration do
      submission = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).submit_buzzer_response!(
        block: @block,
        answer: params[:answer]
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      track_event(Analytics::Events::RESPONSE_SUBMITTED, block_id: @block.id, block_kind: @block.kind, response_kind: "buzzer")

      render json: { success: true, submission: { id: submission.id, answer: submission.answer } }, status: 200
    end
  end

  # DELETE /api/experiences/:experience_id/blocks/:id/clear_buzzer_responses
  def clear_buzzer_responses
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).clear_buzzer_responses!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/family_feud/auto_categorize
  def auto_categorize
    with_experience_orchestration do
      buckets = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).auto_categorize_family_feud!(
        question_id: params[:question_id]
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: { buckets: buckets } }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/family_feud/generate_synthetic_answers
  def generate_synthetic_answers
    with_experience_orchestration do
      answers = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).generate_family_feud_synthetic_answers!(
        question_id: params[:question_id],
        question_text: params[:question_text],
        count: params[:count]
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: { answers: answers } }, status: 200
    end
  end

  # PATCH /api/experiences/:experience_id/blocks/:id/family_feud/ai_context
  def update_ai_context
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).update_family_feud_ai_context!(
        block: @block,
        ai_context: params[:ai_context]
      )

      render json: { success: true }, status: 200
    end
  end

  # PATCH /api/experiences/:experience_id/blocks/:id/family_feud/question_ai_context
  def update_question_ai_context
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).update_family_feud_question_ai_context!(
        question_id: params[:question_id],
        ai_context: params[:ai_context]
      )

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/submit_photo_upload_response
  def submit_photo_upload_response
    with_experience_orchestration do
      submission = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).submit_photo_upload_response!(
        block: @block,
        photo_signed_id: params[:photo_signed_id],
        answer: params[:answer] || {}
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      track_event(Analytics::Events::RESPONSE_SUBMITTED, block_id: @block.id, block_kind: @block.kind, response_kind: "photo_upload")

      photo_url = submission.photo.attached? ? ActiveStorageUrlService.blob_url(submission.photo.blob) : nil
      render json: { success: true, submission: { id: submission.id, answer: submission.answer, photo_url: photo_url } }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/family_feud/add_bucket
  def add_bucket
    with_experience_orchestration do
      bucket = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).add_family_feud_bucket!(
        question_id: params[:question_id],
        name: params[:name] || "New Bucket"
      )

      Experiences::Broadcaster.new(@experience).broadcast_family_feud_update(
        block_id: params[:id],
        operation: 'bucket_added',
        data: { questionId: params[:question_id], bucket: bucket }
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: { bucket: bucket } }, status: 200
    end
  end

  # PATCH /api/experiences/:experience_id/blocks/:id/family_feud/buckets/:bucket_id
  def rename_bucket
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).rename_family_feud_bucket!(
        question_id: params[:question_id],
        bucket_id: params[:bucket_id],
        name: params[:name]
      )

      Experiences::Broadcaster.new(@experience).broadcast_family_feud_update(
        block_id: params[:id],
        operation: 'bucket_renamed',
        data: { bucketId: params[:bucket_id], name: params[:name], questionId: params[:question_id] }
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # DELETE /api/experiences/:experience_id/blocks/:id/family_feud/buckets/:bucket_id
  def delete_bucket
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).delete_family_feud_bucket!(
        question_id: params[:question_id],
        bucket_id: params[:bucket_id]
      )

      Experiences::Broadcaster.new(@experience).broadcast_family_feud_update(
        block_id: params[:id],
        operation: 'bucket_deleted',
        data: { bucketId: params[:bucket_id], questionId: params[:question_id] }
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # PATCH /api/experiences/:experience_id/blocks/:id/family_feud/answers/:answer_id/bucket
  def assign_answer
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).assign_family_feud_answer!(
        question_id: params[:question_id],
        answer_id: params[:answer_id],
        bucket_id: params[:bucket_id]
      )

      Experiences::Broadcaster.new(@experience).broadcast_family_feud_update(
        block_id: params[:id],
        operation: 'answer_assigned',
        data: {
          answerId: params[:answer_id],
          bucketId: params[:bucket_id],
          questionId: params[:question_id]
        }
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/family_feud/start_playing
  def start_playing
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).start_family_feud_playing!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: { block: block } }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/family_feud/reveal_bucket
  def reveal_bucket
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).reveal_family_feud_bucket!(
        block: @block,
        question_index: params[:question_index].to_i,
        bucket_index: params[:bucket_index].to_i
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/family_feud/show_x
  def show_x
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).show_family_feud_x!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)
      Minigames::ClearShowXJob.set(wait: 3.seconds).perform_later(@block.id)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/family_feud/theme_music
  def set_theme_music
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).set_family_feud_theme_music!(
        block: @block,
        playing: ActiveModel::Type::Boolean.new.cast(params[:playing])
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/family_feud/theme_music/restart
  def restart_theme_music
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).restart_family_feud_theme_music!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/family_feud/next_question
  def next_question
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).next_family_feud_question!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/family_feud/restart_playing
  def restart_playing
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).restart_family_feud_playing!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/family_feud/restart_categorizing
  def restart_categorizing
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).restart_family_feud_categorizing!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/family_feud/restart_everything
  def restart_everything
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).restart_family_feud_everything!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/guess_who/start
  def start_guess_who
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).start_guess_who!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/guess_who/reroll_mystery
  def reroll_guess_who_mystery
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).reroll_guess_who_mystery!(
        block: @block,
        contestant_index: params[:contestant_index]
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # PATCH /api/experiences/:experience_id/blocks/:id/guess_who/clues
  def curate_guess_who_clues
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).curate_guess_who_clues!(
        block: @block,
        contestant_index: params[:contestant_index],
        clue_order: params[:clue_order] || [],
        hidden_clue_ids: params[:hidden_clue_ids] || []
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/guess_who/advance_clue
  def advance_guess_who_clue
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).advance_guess_who_clue!(
        block: @block,
        contestant_index: params[:contestant_index],
        direction: params[:direction]
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/guess_who/monitor_view
  def set_guess_who_monitor_view
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).set_guess_who_monitor_view!(
        block: @block,
        view: params[:view]
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/guess_who/dispatch_poll
  def dispatch_guess_who_poll
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).dispatch_guess_who_poll!(
        block: @block,
        contestant_index: params[:contestant_index]
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/guess_who/conclude_poll
  def conclude_guess_who_poll
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).conclude_guess_who_poll!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/minigame/start
  def start_minigame_arithmetic
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).start_minigame_arithmetic!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: block }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/minigame/end
  def end_minigame_arithmetic
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).end_minigame_arithmetic!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: block }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/minigame/arithmetic/restart
  def restart_minigame_arithmetic
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).restart_minigame_arithmetic!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: block }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/minigame/responses
  def submit_minigame_arithmetic_response
    with_experience_orchestration do
      # The round runs client-side and posts answers fire-and-forget; we just
      # record best-effort. No broadcast (would not scale to a large audience)
      # and no progress in the response (the client owns its own progression).
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).submit_minigame_arithmetic_response!(
        block:          @block,
        question_index: params[:question_index],
        answer:         params[:answer]
      )

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/minigame/balloon_pump/start
  def start_minigame_balloon_pump
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).start_minigame_balloon_pump!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: block }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/minigame/balloon_pump/end
  def end_minigame_balloon_pump
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).end_minigame_balloon_pump!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: block }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/minigame/balloon_pump/restart
  def restart_minigame_balloon_pump
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).restart_minigame_balloon_pump!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: block }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/minigame/balloon_pump/pump
  def submit_minigame_balloon_pump_update
    with_experience_orchestration do
      outcome = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).submit_balloon_pump_update!(
        block:       @block,
        fill_amount: params[:fill_amount]
      )

      if outcome[:winners]&.any?
        Experiences::Broadcaster.enqueue_update(@experience)
      elsif outcome[:leader_updated]
        Minigames::BroadcastBalloonPumpLeaderJob.perform_later(@block.id)
      end

      render json: { success: true, result: outcome[:result] }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/collaborative_drawing/photos
  def submit_collaborative_drawing_photo
    with_experience_orchestration do
      submission = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).submit_collaborative_drawing_photo!(
        block: @block,
        photo_signed_id: params[:photo_signed_id],
        answer: params[:answer] || {}
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      photo_url = submission.photo.attached? ? ActiveStorageUrlService.blob_url(submission.photo.blob) : nil
      render json: { success: true, submission: { id: submission.id, answer: submission.answer, photo_url: photo_url } }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/collaborative_drawing/start
  def start_collaborative_drawing_round
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).start_collaborative_drawing_round!(block: @block)

      # Push the new payload (pool + timing) to everyone, then force each
      # participant to re-pull client state so they receive their per-person
      # slice assignment before the preview begins.
      Experiences::Broadcaster.enqueue_update(@experience)
      Experiences::Broadcaster.new(@experience).broadcast_resubscribe_all

      render json: { success: true, data: block }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/collaborative_drawing/end
  def end_collaborative_drawing_round
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).end_collaborative_drawing_round!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: block }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/collaborative_drawing/restart
  def restart_collaborative_drawing
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).restart_collaborative_drawing!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)
      Experiences::Broadcaster.new(@experience).broadcast_resubscribe_all

      render json: { success: true, data: block }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/collaborative_drawing/drawings
  def submit_collaborative_drawing
    with_experience_orchestration do
      submission = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).submit_collaborative_drawing!(
        block: @block,
        image: params[:image]
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      answer = submission ? { image: submission.drawing_image } : nil
      render json: { success: true, submission: submission && { id: submission.id, answer: answer } }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/guess_who/reveal
  def reveal_guess_who
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).reveal_guess_who!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/guess_who/theme_music
  def set_guess_who_theme_music
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).set_guess_who_theme_music!(
        block: @block,
        playing: ActiveModel::Type::Boolean.new.cast(params[:playing])
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/guess_who/theme_music/restart
  def restart_guess_who_theme_music
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).restart_guess_who_theme_music!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/the_scene/start
  def start_the_scene
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).start_the_scene!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: block }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/the_scene/end
  def end_the_scene
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).end_the_scene!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: block }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/the_scene/force_next_scene
  def force_next_the_scene
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).force_next_scene!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: block }, status: 200
    end
  end

  # PATCH /api/experiences/:experience_id/blocks/:id/the_scene/performers
  def update_the_scene_performers
    with_experience_orchestration do
      block = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).update_the_scene_performers!(
        block: @block,
        performer_participant_ids: Array(params[:performer_participant_ids])
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true, data: block }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/the_scene/buzzer
  def press_the_scene_buzzer
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).press_the_scene_buzzer!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/the_scene/clear_top
  def clear_the_scene_top
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).clear_the_scene_top!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/the_scene/clear/:suggestion_id
  def clear_the_scene_suggestion
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).clear_the_scene_suggestion!(
        block: @block,
        suggestion_id: params[:suggestion_id]
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/the_scene/clear_all
  def clear_the_scene_all
    with_experience_orchestration do
      Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).clear_the_scene_all!(block: @block)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/the_scene/suggestions
  def submit_the_scene_suggestion
    with_experience_orchestration do
      suggestion = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).submit_the_scene_suggestion!(
        block: @block,
        text: params[:text]
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: {
        success: true,
        suggestion: { id: suggestion.id, text: suggestion.text }
      }, status: 200
    end
  end

  # POST /api/experiences/:experience_id/blocks/:id/the_scene/votes
  def submit_the_scene_vote
    with_experience_orchestration do
      vote = Experiences::Orchestrator.new(
        experience: @experience, actor: @user
      ).submit_the_scene_vote!(
        block: @block,
        suggestion_id: params[:suggestion_id]
      )

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: {
        success: true,
        vote: { id: vote.id, improv_suggestion_id: vote.improv_suggestion_id }
      }, status: 200
    end
  end

  private

  def set_block
    @block = @experience.experience_blocks.find(params[:id])
  end

  def authorize_block_submission!
    authorize! @block, to: :"#{action_name}?", with: ExperienceBlockPolicy
  end

  def create_params
    permitted = params.require(:block).permit(
      :kind,
      :status,
      :open_immediately,
      :show_in_lobby,
      :add_to_playbill,
      :playbill_mysterious,
      visible_to_roles: [],
      visible_to_segment_ids: [],
      target_user_ids: []
    )

    permitted[:payload] = params[:block][:payload] if params[:block][:payload]
    permitted[:questions] = params[:block][:questions] if params[:block][:questions]

    permitted
  end

  def update_params
    permitted = params.require(:block).permit(visible_to_segment_ids: [])
    permitted[:payload] = params[:block][:payload] if params[:block][:payload]
    permitted[:questions] = params[:block][:questions] if params[:block][:questions]
    permitted
  end
end
