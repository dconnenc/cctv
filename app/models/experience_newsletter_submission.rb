class ExperienceNewsletterSubmission < ApplicationRecord
  belongs_to :experience_block
  belongs_to :experience_participant

  validates :answer, presence: true
  validate :block_is_newsletter_type, on: :create

  private

  def block_is_newsletter_type
    return unless experience_block

    unless experience_block.kind == ExperienceBlock::NEWSLETTER_SIGNUP
      errors.add(:experience_block, "must be a newsletter signup block")
    end
  end
end
