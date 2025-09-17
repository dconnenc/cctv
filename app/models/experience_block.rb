class ExperienceBlock < ApplicationRecord
  KINDS = [
    "poll"
  ]

  belongs_to :experience

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
