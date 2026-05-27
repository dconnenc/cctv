class ExperiencePhotoUploadSubmission < ApplicationRecord
  belongs_to :experience_block
  belongs_to :experience_participant

  has_one_attached :photo

  validate :block_is_photo_upload_type, on: :create

  private

  def block_is_photo_upload_type
    return unless experience_block

    unless experience_block.kind == "photo_upload"
      errors.add(:experience_block, "must be a photo_upload block")
    end
  end
end
