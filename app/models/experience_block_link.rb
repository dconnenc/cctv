class ExperienceBlockLink < ApplicationRecord
  belongs_to :parent_block, class_name: "ExperienceBlock"
  belongs_to :child_block, class_name: "ExperienceBlock"

  enum :relationship, {
    depends_on: "depends_on",
    source: "source"
  }

  scope :sources, -> { where(relationship: "source") }
  scope :depends_on, -> { where(relationship: "depends_on") }
  scope :ordered, -> { order(position: :asc) }

  validates :parent_block_id, :child_block_id, presence: true
  validates :child_block_id,
    uniqueness: { scope: [:parent_block_id, :relationship] }
  validate :no_self_loops
  validate :no_cycles, if: :depends_on?
  validate :depth_limit, if: :depends_on?
  validate :child_has_single_parent_link, if: :depends_on?

  after_commit :sync_child_parent_id, on: [:create, :update], if: :depends_on?

  def self.would_create_cycle?(parent_id, child_id)
    sql = <<~SQL
      WITH RECURSIVE ancestors(ancestor_id) AS (
        SELECT parent_block_id
        FROM experience_block_links
        WHERE child_block_id = :child_id AND relationship = 'depends_on'

        UNION

        SELECT ebl.parent_block_id
        FROM experience_block_links ebl
        JOIN ancestors a ON ebl.child_block_id = a.ancestor_id
        WHERE ebl.relationship = 'depends_on'
      )
      SELECT 1 FROM ancestors WHERE ancestor_id = :parent_id LIMIT 1
    SQL

    result = connection.execute(
      sanitize_sql([sql, { parent_id: parent_id, child_id: child_id }])
    )

    result.any?
  end

  private

  def no_self_loops
    if parent_block_id == child_block_id
      errors.add(:base, "Block cannot depend on itself")
    end
  end

  def no_cycles
    return unless parent_block_id && child_block_id
    return if parent_block_id == child_block_id

    if self.class.would_create_cycle?(parent_block_id, child_block_id)
      errors.add(:base, "Cannot create circular dependency")
    end
  end

  def depth_limit
    return unless child_block

    if child_block.depth >= ExperienceBlock::MAX_DEPENDENCY_DEPTH
      errors.add(
        :base,
        "Maximum dependency depth of #{ExperienceBlock::MAX_DEPENDENCY_DEPTH} exceeded"
      )
    end
  end

  def child_has_single_parent_link
    return unless child_block_id

    conflict = self.class.depends_on
      .where(child_block_id: child_block_id)
      .where.not(id: id)
      .exists?

    errors.add(:base, "Block already has a parent dependency") if conflict
  end

  def sync_child_parent_id
    child_block.update_column(:parent_block_id, parent_block_id) if child_block.parent_block_id != parent_block_id
  end
end
