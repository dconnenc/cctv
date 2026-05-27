class ExperienceQuestionSubmission < ApplicationRecord
  belongs_to :experience_block
  belongs_to :experience_participant

  validates :answer, presence: true
  validate :block_is_question_type, on: :create

  private

  def block_is_question_type
    return unless experience_block

    unless experience_block.kind == "question"
      errors.add(:experience_block, "must be a question block")
    end
  end
end
