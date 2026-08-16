class Api::ExperienceSegmentsController < Api::BaseController
  before_action :authenticate_and_set_user_and_experience
  before_action -> { authorize! @experience, to: :manage_blocks? }

  after_action :verify_authorized

  # POST /api/experiences/:experience_id/segments
  def create
    with_experience_orchestration do
      segment = orchestrator.create_segment!(
        name: segment_params[:name],
        color: segment_params[:color].presence || Experience::DEFAULT_SEGMENT_COLOR
      )

      broadcast_and_render(segment)
    end
  end

  # PATCH /api/experiences/:experience_id/segments/:id
  def update
    with_experience_orchestration do
      segment = orchestrator.update_segment!(
        segment_id: params[:id],
        name: segment_params[:name],
        color: segment_params[:color]
      )

      broadcast_and_render(segment)
    end
  end

  # DELETE /api/experiences/:experience_id/segments/:id
  def destroy
    with_experience_orchestration do
      orchestrator.destroy_segment!(segment_id: params[:id])

      @experience.reload
      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }
    end
  end

  # POST /api/experiences/:experience_id/segments/:id/assign
  def assign
    with_experience_orchestration do
      affected = @experience.experience_participants
        .where(id: assign_params[:participant_ids])
        .includes(:experience_segments)
      old_fingerprints = affected.map do |p|
        { participant: p, old_fingerprint: Experiences::Broadcaster.visibility_fingerprint(@experience, p) }
      end

      if assign_params[:assign_action] == 'remove'
        orchestrator.remove_participants!(
          segment_id: params[:id],
          participant_ids: assign_params[:participant_ids]
        )
      else
        orchestrator.assign_participants!(
          segment_id: params[:id],
          participant_ids: assign_params[:participant_ids]
        )
      end

      @experience.reload
      Experiences::Broadcaster.new(@experience).broadcast_profile_changes(
        profile_changes: old_fingerprints
      )
      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }
    end
  end

  private

  def orchestrator
    @orchestrator ||= Experiences::SegmentOrchestrator.new(
      experience: @experience,
      actor: @user
    )
  end

  def segment_params
    params.permit(:name, :color)
  end

  def assign_params
    params.permit(:assign_action, participant_ids: [])
  end

  def serialize_segment(segment)
    {
      id: segment.id,
      name: segment.name,
      color: segment.color,
      position: segment.position
    }
  end

  def broadcast_and_render(segment)
    @experience.reload
    Experiences::Broadcaster.enqueue_update(@experience)

    render json: {
      success: true,
      data: serialize_segment(segment)
    }
  end
end
