class ExperienceParticipant < ApplicationRecord
  belongs_to :experience
  belongs_to :user

  enum :status, { registered: "registered", active: "active" }
  enum :role, {
    audience: "audience",
    player: "player",
    moderator: "moderator",
    host: "host"
  }
end
