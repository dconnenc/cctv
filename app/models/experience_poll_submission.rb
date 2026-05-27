class ExperiencePollSubmission < ApplicationRecord
  belongs_to :experience_block
  belongs_to :experience_participant

  validates :answer, presence: true
  validate :block_is_poll_type, on: :create

  private

  def block_is_poll_type
    return unless experience_block

    unless experience_block.kind == "poll"
      errors.add(:experience_block, "must be a poll block")
    end
  end
end
