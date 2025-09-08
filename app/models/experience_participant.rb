class ExperienceParticipant < ApplicationRecord
  belongs_to :experience
  belongs_to :user

  enum :status, { registered: "registered", active: "active" }
end
