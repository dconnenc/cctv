class ExperienceAuthService
  JWT_SECRET = ENV.fetch("JWT_EXPERIENCE_SECRET", "todo-implement")

  def self.jwt_token_for(experience, user)
    new(experience).jwt_token_for(user)
  end

  attr_reader :experience
  def initialize(experience)
    @experience = experience
  end

  def jwt_token_for(user)
    JWT.encode(
      {
        user_id: user.id,
        experience_id: experience.id,
        exp: (24 * 7).hours.from_now.to_i
      },
      JWT_SECRET
    )
  end
end
