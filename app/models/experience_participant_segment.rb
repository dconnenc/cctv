class ExperienceParticipantSegment < ApplicationRecord
  include Tenanted

  belongs_to :experience_participant
  belongs_to :experience_segment
end
