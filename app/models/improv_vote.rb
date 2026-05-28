class ImprovVote < ApplicationRecord
  belongs_to :experience_block
  belongs_to :experience_participant
  belongs_to :improv_suggestion

  validates :scene_started_at, presence: true
  validate :participant_cannot_vote_for_own_suggestion

  private

  def participant_cannot_vote_for_own_suggestion
    return unless improv_suggestion && experience_participant_id

    if improv_suggestion.experience_participant_id == experience_participant_id
      errors.add(:improv_suggestion_id, "cannot be your own suggestion")
    end
  end
end
