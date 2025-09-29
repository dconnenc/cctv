class ExperienceBlock < ApplicationRecord
  KINDS = [
    POLL = "poll",
    QUESTION = "question",
    MULTISTEP_FORM = "multistep_form",
    ANNOUNCEMENT = "announcement",
    MAD_LIB = "mad_lib"
  ]

  belongs_to :experience

  has_many :experience_poll_submissions, dependent: :destroy
  has_many :experience_question_submissions, dependent: :destroy
  has_many :experience_multistep_form_submissions, dependent: :destroy
  has_many :experience_mad_lib_submissions, dependent: :destroy

  enum status: {
    hidden: "hidden",
    open: "open",
    closed: "closed"
  }

  validates :kind, presence: true, inclusion: { in: KINDS }
  validate :visibility_roles

  private

  def visibility_roles
    allowed = ExperienceParticipant.roles.keys.map(&:to_s)
    invalid = (visible_to_roles || []) - allowed

    if invalid.any?
      errors.add(:visible_to_roles, "contain invalid roles: #{invalid.join(", ")}")
    end
  end
end
