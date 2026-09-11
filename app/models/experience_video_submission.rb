class ExperienceVideoSubmission < ApplicationRecord
  belongs_to :experience_block
  belongs_to :experience_participant

  has_one_attached :video

  validate :block_is_newscasters_source_type, on: :create

  # A source video is either an uploaded file (ActiveStorage attachment) or an
  # external link stored in `answer`. `video_url` resolves to whichever exists.
  def video_url
    if video.attached?
      ActiveStorageUrlService.blob_url(video.blob)
    else
      answer["url"]
    end
  end

  def video_kind
    answer["kind"]
  end

  private

  def block_is_newscasters_source_type
    return unless experience_block

    unless experience_block.kind == ExperienceBlock::NEWSCASTERS_SOURCE
      errors.add(:experience_block, "must be a newscasters_source block")
    end
  end
end
