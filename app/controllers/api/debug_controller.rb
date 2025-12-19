class Api::DebugController < Api::BaseController
  before_action :authenticate_and_set_user_and_experience
  before_action :require_development_or_test

  # POST /api/experiences/:experience_id/debug/create_participants
  def create_participants
    count = params[:count].to_i.clamp(1, 100)

    participants = []

    count.times do |i|
      uuid = SecureRandom.uuid
      email = "debug-#{uuid}@test.local"
      name = "Debug User #{i + 1}"

      user = User.create!(email: email, name: name)
      participant = @experience.register_user(user, name: name)
      jwt = @experience.jwt_for_participant(user)

      participants << {
        id: participant.id,
        user_id: user.id,
        name: name,
        email: email,
        jwt: jwt
      }
    end

    Experiences::Broadcaster.new(@experience).broadcast_experience_update

    render json: {
      success: true,
      participants: participants
    }, status: 200
  end

  # POST /api/experiences/:experience_id/debug/get_participant_jwts
  # Returns JWTs for existing participants so they can be used for simulation
  def get_participant_jwts
    participant_ids = params[:participant_ids] || []
    
    participants = @experience.experience_participants.where(id: participant_ids).includes(:user)
    
    result = participants.map do |participant|
      {
        id: participant.id,
        user_id: participant.user_id,
        name: participant.name,
        email: participant.user.email,
        jwt: @experience.jwt_for_participant(participant.user)
      }
    end

    render json: {
      success: true,
      participants: result
    }, status: 200
  end

  private

  def require_development_or_test
    unless Rails.env.development? || Rails.env.test?
      render json: { success: false, error: "Debug endpoints are only available in development/test" }, status: :forbidden
    end
  end
end
