class ExperiencePhotoUploadSubmission < ApplicationRecord
  belongs_to :experience_block
  belongs_to :user

  has_one_attached :photo

  validate :user_can_submit_to_block, on: :create
  validate :block_is_photo_upload_type, on: :create

  private

  def user_can_submit_to_block
    return unless user && experience_block

    policy = ExperienceBlockPolicy.new(experience_block, user: user)
    unless policy.submit_photo_upload_response?
      errors.add(:base, "You are not authorized to submit to this block")
    end
  end

  def block_is_photo_upload_type
    return unless experience_block

    unless experience_block.kind == "photo_upload"
      errors.add(:experience_block, "must be a photo_upload block")
    end
  end

end
