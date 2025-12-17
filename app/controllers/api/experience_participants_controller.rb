class Api::ExperienceParticipantsController < Api::BaseController
  before_action :authenticate_and_set_user_and_experience

  # POST /api/experiences/:experience_id/participants/:id/avatar
  def avatar
    participant = @experience.experience_participants.find(params[:id])

    # Authorization: system admin, host/moderator for this experience, or the participant themselves
    is_system_admin = @user&.admin? || @user&.superadmin?
    is_self = participant.user_id == @user&.id
    is_host_or_mod = @experience.experience_participants.where(user_id: @user&.id, role: %w[host moderator]).exists?

    unless is_system_admin || is_self || is_host_or_mod
      render json: { success: false, error: 'forbidden' }, status: :forbidden
      return
    end

    avatar = participant.avatar || {}
    image = params.dig(:avatar, :image)
    position = params.dig(:avatar, :position)
    avatar[:image] = image if image.present?
    avatar[:position] = position if position.present?

    participant.update!(avatar: avatar)

    Experiences::Broadcaster.new(@experience).broadcast_experience_update

    render json: { success: true }
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, error: 'participant not found' }, status: :not_found
  rescue StandardError => e
    render json: { success: false, error: e.message }, status: :unprocessable_entity
  end
end

