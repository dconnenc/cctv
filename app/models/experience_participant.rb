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

  validate :validate_segments

  private

  def validate_segments
    return if segments.blank?

    defined_names = experience.experience_segments.pluck(:name)
    invalid = segments - defined_names
    if invalid.any?
      errors.add(:segments, "contain undefined segments: #{invalid.join(', ')}")
    end
  end
end
