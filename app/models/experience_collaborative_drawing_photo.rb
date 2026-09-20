class ExperienceCollaborativeDrawingPhoto < ApplicationRecord
  belongs_to :experience_block
  belongs_to :experience_participant

  has_one_attached :photo

  validate :block_is_collaborative_drawing_type, on: :create

  private

  def block_is_collaborative_drawing_type
    return unless experience_block

    unless experience_block.kind == ExperienceBlock::COLLABORATIVE_DRAWING
      errors.add(:experience_block, "must be a collaborative_drawing block")
    end
  end
end
