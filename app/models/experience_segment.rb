class ExperienceSegment < ApplicationRecord
  belongs_to :experience

  has_many :experience_participant_segments, dependent: :destroy
  has_many :experience_participants, through: :experience_participant_segments

  has_many :experience_block_segments, dependent: :destroy
  has_many :experience_blocks, through: :experience_block_segments

  validates :name, presence: true, length: { maximum: 50 },
    uniqueness: { scope: :experience_id }
  validates :color, presence: true
  validates :position, presence: true,
    numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
