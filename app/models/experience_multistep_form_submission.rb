class ExperienceMultistepFormSubmission < ApplicationRecord
  belongs_to :experience_block
  belongs_to :user

  validates :answer, presence: true
  validate :user_can_submit_to_block
  validate :block_is_multistep_form_type

  private

  def user_can_submit_to_block
    return unless user && experience_block

    policy = ExperienceBlockPolicy.new(experience_block, user: user)
    unless policy.submit_multistep_form_response?
      errors.add(:base, "You are not authorized to submit to this multistep form")
    end
  end

  def block_is_multistep_form_type
    return unless experience_block

    unless experience_block.kind == "multistep_form"
      errors.add(:experience_block, "must be a multistep form block")
    end
  end
end