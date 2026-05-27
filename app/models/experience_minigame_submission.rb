class ExperienceMinigameSubmission < ApplicationRecord
  belongs_to :experience_block
  belongs_to :experience_participant

  validates :question_index, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :submitted_at, presence: true
  validates :experience_participant_id, uniqueness: { scope: [:experience_block_id, :question_index] }
end
