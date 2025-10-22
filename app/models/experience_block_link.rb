class ExperienceBlockLink < ApplicationRecord
  belongs_to :parent_block, class_name: "ExperienceBlock"
  belongs_to :child_block, class_name: "ExperienceBlock"

  enum relationship: {
    depends_on: "depends_on"
  }

  validates :parent_block_id, :child_block_id, presence: true
  validate :no_self_loops
  validate :no_cycles
  validate :depth_limit

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

    if child_block_id.depth >= ExperienceBlock::MAX_DEPENDENCY_DEPTH
      errors.add(
        :base,
        "Maximum dependency depth of #{ExperienceBlock::MAX_DEPENDENCY_DEPTH} exceeded"
      )
    end
  end

  def self.would_create_cycle?(parent_id, child_id)
    sql = <<~SQL
      WITH RECURSIVE ancestors(ancestor_id) AS (
        SELECT parent_block_id
        FROM experience_block_links
        WHERE child_block_id = :child_id

        UNION

        SELECT ebl.parent_block_id
        FROM experience_block_links ebl
        JOIN ancestors a ON ebl.child_block_id = a.ancestor_id
      )
      SELECT 1 FROM ancestors WHERE ancestor_id = :parent_id LIMIT 1
    SQL

    result = connection.execute(
      sanitize_sql([sql, { parent_id: parent_id, child_id: child_id }])
    )

    result.any?
  end
end
