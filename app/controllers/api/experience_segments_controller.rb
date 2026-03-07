class Api::ExperienceSegmentsController < Api::BaseController
  before_action :authenticate_and_set_user_and_experience

  # GET /api/experiences/:experience_id/segments
  def index
    segments = @experience.experience_segments.order(position: :asc)

    render json: {
      success: true,
      data: segments.map { |s| serialize_segment(s) }
    }
  end

  # POST /api/experiences/:experience_id/segments
  def create
    with_experience_orchestration do
      segment = orchestrator.create_segment!(
        name: segment_params[:name],
        color: segment_params[:color] || '#6B7280'
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
      Experiences::Broadcaster.new(@experience).broadcast_experience_update

      render json: { success: true }
    end
  end

  # POST /api/experiences/:experience_id/segments/:id/assign
  def assign
    with_experience_orchestration do
      if assign_params[:action] == 'remove'
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
      Experiences::Broadcaster.new(@experience).broadcast_experience_update

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
    params.permit(:action, participant_ids: [])
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
    Experiences::Broadcaster.new(@experience).broadcast_experience_update

    render json: {
      success: true,
      data: serialize_segment(segment)
    }
  end
end
