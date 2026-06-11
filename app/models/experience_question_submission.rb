class ExperienceQuestionSubmission < ApplicationRecord
  AI_GENERATED_SOURCE = "ai_generated".freeze
  PARTICIPANT_SOURCE = "participant".freeze

  belongs_to :experience_block
  belongs_to :experience_participant, optional: true

  validates :answer, presence: true
  validate :block_is_question_type, on: :create

  scope :ai_generated, -> { where(source: AI_GENERATED_SOURCE) }

  private

  def block_is_question_type
    return unless experience_block

    unless experience_block.kind == "question"
      errors.add(:experience_block, "must be a question block")
    end
  end
end
