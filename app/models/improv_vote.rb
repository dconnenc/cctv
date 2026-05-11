class ImprovVote < ApplicationRecord
  belongs_to :experience_block
  belongs_to :user
  belongs_to :improv_suggestion

  validates :scene_started_at, presence: true
  validate :user_cannot_vote_for_own_suggestion

  private

  def user_cannot_vote_for_own_suggestion
    return unless improv_suggestion && user_id

    if improv_suggestion.user_id == user_id
      errors.add(:improv_suggestion_id, "cannot be your own suggestion")
    end
  end
end
