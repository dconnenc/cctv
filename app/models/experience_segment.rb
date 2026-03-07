class ExperienceSegment < ApplicationRecord
  belongs_to :experience

  validates :name, presence: true, length: { maximum: 50 },
    uniqueness: { scope: :experience_id }
  validates :color, presence: true
  validates :position, presence: true,
    numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
