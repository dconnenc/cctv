class ExperienceParticipant < ApplicationRecord
  belongs_to :experience
  belongs_to :user

  has_many :experience_participant_segments, dependent: :destroy
  has_many :experience_segments, through: :experience_participant_segments

  enum :status, { registered: "registered", active: "active" }
  enum :role, {
    audience: "audience",
    player: "player",
    moderator: "moderator",
    host: "host"
  }

  def segment_names
    experience_segments.pluck(:name)
  end
end
