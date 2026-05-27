class Api::ExperienceAvatarController < Api::BaseController
  before_action :authenticate_and_set_user_and_experience
  before_action :set_participant!
  before_action -> { authorize! @participant, to: :update_avatar? }

  after_action :verify_authorized

  # POST /api/experiences/:id/avatar
  def create
    with_experience_orchestration do
      participant = Experiences::Orchestrator.new(experience: @experience, actor: @user)
        .update_participant_avatar!(participant: @participant, strokes: params.dig(:avatar, :strokes))

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

      render json: { success: true, avatar: participant.avatar }
    end
  end

  private

  def set_participant!
    @participant = @experience.experience_participants.find_by(user: @user)
    unless @participant
      skip_verify_authorized!
      render json: { success: false, error: 'participant not found' }, status: :not_found
    end
  end
end
