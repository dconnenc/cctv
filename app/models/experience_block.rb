class ExperienceBlock < ApplicationRecord
  MAX_DEPENDENCY_DEPTH = 5

  KINDS = [
    POLL = "poll",
    QUESTION = "question",
    MULTISTEP_FORM = "multistep_form",
    ANNOUNCEMENT = "announcement",
    MAD_LIB = "mad_lib",
    FAMILY_FEUD = "family_feud",
    PHOTO_UPLOAD = "photo_upload"
  ]

  belongs_to :experience
  belongs_to :parent_block,
    class_name: "ExperienceBlock",
    optional: true

  has_many :child_blocks,
    -> { order(position: :asc) },
    class_name: "ExperienceBlock",
    foreign_key: :parent_block_id,
    dependent: :destroy

  has_many :experience_poll_submissions, dependent: :destroy
  has_many :experience_question_submissions, dependent: :destroy
  has_many :experience_multistep_form_submissions, dependent: :destroy
  has_many :experience_mad_lib_submissions, dependent: :destroy
  has_many :experience_photo_upload_submissions, dependent: :destroy

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
    -> { order(position: :asc) },
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

  validates :position,
    presence: true,
    numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  after_create :sync_parent_from_links

  scope :parent_blocks, -> { where(parent_block_id: nil) }
  scope :child_blocks, -> { where.not(parent_block_id: nil) }
  scope :ordered, -> { order(position: :asc) }

  def has_dependencies?
    children.loaded? ? children.any? : children.exists?
  end

  def depth
    return 0 if children.empty?

    1 + children.map(&:depth).max
  end

  def leaf_block?
    children.empty?
  end

  def parent_block?
    parent_block_id.nil?
  end

  def child_block?
    parent_block_id.present?
  end

  def siblings
    if parent_block?
      experience.experience_blocks.parent_blocks.where.not(id: id)
    else
      ExperienceBlock.where(parent_block_id: parent_block_id).where.not(id: id)
    end
  end

  def next_sibling
    siblings.where("position > ?", position).order(position: :asc).first
  end

  def previous_sibling
    siblings.where("position < ?", position).order(position: :desc).first
  end

  # Family Feud specific methods
  def clear_family_feud_bucket_assignments!
    return unless kind == FAMILY_FEUD

    child_blocks.each do |child_block|
      child_payload = child_block.payload || {}
      if child_payload["buckets"]
        child_payload["buckets"].each do |bucket|
          bucket["answer_ids"] = []
        end
        child_block.update!(payload: child_payload)
      end
    end
  end

  def clear_all_family_feud_buckets!
    return unless kind == FAMILY_FEUD

    child_blocks.each do |child_block|
      child_payload = child_block.payload || {}
      child_payload["buckets"] = []
      child_block.update!(payload: child_payload)
    end
  end

  def open!
    transaction do
      descendant_ids = all_descendant_ids

      ExperienceBlock.where(id: descendant_ids).update_all(status: :open)
      self.update!(status: :open)
    end
  end

  def close!
    transaction do
      descendant_ids = all_descendant_ids

      ExperienceBlock.where(id: descendant_ids).update_all(status: :closed) if descendant_ids.any?
      self.update!(status: :closed)
    end
  end

  def hide!
    transaction do
      descendant_ids = all_descendant_ids

      ExperienceBlock.where(id: descendant_ids).update_all(status: :hidden) if descendant_ids.any?
      self.update!(status: :hidden)
    end
  end

  def all_descendant_ids
    return [] unless child_blocks.exists?

    sql = <<~SQL
      WITH RECURSIVE descendants(id) AS (
        SELECT id
        FROM experience_blocks
        WHERE parent_block_id = :block_id

        UNION

        SELECT eb.id
        FROM experience_blocks eb
        JOIN descendants d ON eb.parent_block_id = d.id
      )
      SELECT id FROM descendants
    SQL

    result = self.class.connection.execute(
      self.class.sanitize_sql([sql, { block_id: id }])
    )

    result.map { |row| row['id'] }
  end

  private

  def sync_parent_from_links
    if parent_links.any? && parent_block_id.nil?
      link = parent_links.first
      update_column(:parent_block_id, link.parent_block_id)
    end
  end

  def visibility_roles
    allowed = ExperienceParticipant.roles.keys.map(&:to_s)
    invalid = (visible_to_roles || []) - allowed

    if invalid.any?
      errors.add(:visible_to_roles, "contain invalid roles: #{invalid.join(", ")}")
    end
  end
end
