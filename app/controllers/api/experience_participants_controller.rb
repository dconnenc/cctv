class Api::ExperienceParticipantsController < Api::BaseController
  before_action :authenticate_and_set_user_and_experience

  # DELETE /api/experiences/:experience_id/participants/:id/kick
  def kick
    with_experience_orchestration do
      # TODO: Cleanup anything related to the removed participant
      # (e.g. active websocket connections, cached state, block responses, etc.)
      Experiences::Orchestrator.new(experience: @experience, actor: @user).kick_participant!(params[:id])

      Experiences::Broadcaster.new(@experience).broadcast_experience_update

      render json: { success: true }
    end
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, error: 'participant not found' }, status: :not_found
  end

  # POST /api/experiences/:experience_id/participants/:id/avatar
  def avatar
    with_experience_orchestration do
      participant = Experiences::Orchestrator.new(experience: @experience, actor: @user)
        .update_participant_avatar!(participant_id: params[:id], strokes: params.dig(:avatar, :strokes))

      Experiences::Broadcaster.new(@experience).broadcast_experience_update

      ActionCable.server.broadcast(
        Experiences::Broadcaster.monitor_stream_key(@experience),
        {
          type: 'drawing_update',
          participant_id: participant.id,
          operation: 'avatar_committed',
          data: { strokes: participant.avatar['strokes'] || [] }
        }
      )

      render json: { success: true }
    end
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, error: 'participant not found' }, status: :not_found
  end
end
