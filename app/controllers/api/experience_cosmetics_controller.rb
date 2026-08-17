class Api::ExperienceCosmeticsController < Api::BaseController
  before_action :authenticate_and_set_user_and_experience
  before_action :set_participant!
  before_action -> { authorize! @participant, to: :show? }

  after_action :verify_authorized

  # GET /api/experiences/:id/cosmetics
  def index
    cosmetics = @user.cosmetics.merge(Cosmetic.active).order(:name)
    render json: { cosmetics: cosmetics.map { |c| CosmeticSerializer.serialize(c) } }
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
