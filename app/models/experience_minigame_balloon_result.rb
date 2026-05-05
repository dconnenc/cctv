class ExperienceMinigameBalloonResult < ApplicationRecord
  belongs_to :experience_block
  belongs_to :user

  validates :fill_amount, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :user_id, uniqueness: { scope: :experience_block_id }
end
