class ExperienceCollaborativeDrawingAssignment < ApplicationRecord
  belongs_to :experience_block
  belongs_to :experience_participant
  belongs_to :source_photo,
    class_name: "ExperienceCollaborativeDrawingPhoto",
    optional: true

  validates :group_index, :slice_index, :slice_count,
    numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :experience_participant_id, uniqueness: { scope: :experience_block_id }

  scope :submitted, -> { where.not(submitted_at: nil) }

  def submitted?
    submitted_at.present?
  end
end
