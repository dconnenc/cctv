class Api::ExperienceParticipantsController < Api::BaseController
  before_action :authenticate_and_set_user_and_experience
  before_action :authorize_kick!, only: [:kick]
  before_action :authorize_avatar!, only: [:avatar]
  before_action :authorize_manage!, only: [:submissions]

  after_action :verify_authorized, only: [:kick, :submissions]

  # DELETE /api/experiences/:experience_id/participants/:id/kick
  def kick
    with_experience_orchestration do
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
        .update_participant_avatar!(participant_id: @target_participant.id, strokes: params.dig(:avatar, :strokes))

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
  end

  # GET /api/experiences/:experience_id/participants/:id/submissions
  def submissions
    participant = @experience.experience_participants.find(params[:id])
    entries = Experiences::ParticipantSubmissions.new(@experience).for_user(participant.user_id)

    render json: { success: true, data: { submissions: entries } }
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, error: 'participant not found' }, status: :not_found
  end

  private

  def authorize_manage!
    authorize! @experience, to: :manage?
  end

  def authorize_kick!
    authorize! @experience, to: :manage?
  end

  def authorize_avatar!
    is_manager = allowed_to?(:manage?, @experience, with: ExperiencePolicy)
    @target_participant = @experience.experience_participants.find_by(id: params[:id])

    unless @target_participant
      render json: { success: false, error: 'participant not found' }, status: :not_found
      return
    end

    is_self = @target_participant.user_id == @user&.id
    render json: { success: false, error: 'forbidden' }, status: :forbidden unless is_self || is_manager
  end
end
