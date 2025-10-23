class ExperienceBlock < ApplicationRecord
  MAX_DEPENDENCY_DEPTH = 5

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

  has_many :parent_links,
    class_name: "ExperienceBlockLink",
    foreign_key: :child_block_id,
    dependent: :destroy
  has_many :parents, through: :parent_links, source: :parent_block

  has_many :child_links,
    class_name: "ExperienceBlockLink",
    foreign_key: :parent_block_id,
    dependent: :destroy
  has_many :children,
    -> { order("experience_block_links.position ASC") },
    through: :child_links,
    source: :child_block

  has_many :variables,
    class_name: "ExperienceBlockVariable",
    dependent: :destroy

  enum status: {
    hidden: HIDDEN = "hidden",
    open: OPEN = "open",
    closed: CLOSED = "closed"
  }

  validates :kind, presence: true, inclusion: { in: KINDS }
  validate :visibility_roles

  def has_dependencies?
    children.exists?
  end

  def depth
    return 0 if children.empty?

    1 + children.map(&:depth).max
  end

  def leaf_block?
    children.empty?
  end

  private

  def visibility_roles
    allowed = ExperienceParticipant.roles.keys.map(&:to_s)
    invalid = (visible_to_roles || []) - allowed

    if invalid.any?
      errors.add(:visible_to_roles, "contain invalid roles: #{invalid.join(", ")}")
    end
  end
end
