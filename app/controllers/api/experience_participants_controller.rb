class Api::ExperienceParticipantsController < Api::BaseController
  before_action :authenticate_and_set_user_and_experience
  before_action :set_participant!
  before_action -> { authorize! @experience, to: :manage? }

  after_action :verify_authorized

  # DELETE /api/experiences/:experience_id/participants/:id/kick
  def kick
    with_experience_orchestration do
      Experiences::Orchestrator.new(experience: @experience, actor: @user).kick_participant!(@participant)

      Experiences::Broadcaster.enqueue_update(@experience)

      render json: { success: true }
    end
  end

  # GET /api/experiences/:experience_id/participants/:id/submissions
  def submissions
    entries = Experiences::ParticipantSubmissions.new(@experience).for_participant(@participant.id)

    render json: { success: true, data: { submissions: entries } }
  end

  private

  def set_participant!
    @participant = @experience.experience_participants.find_by(id: params[:id])
    unless @participant
      skip_verify_authorized!
      render json: { success: false, error: 'participant not found' }, status: :not_found
    end
  end
end
