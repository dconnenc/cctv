class ExperienceBlockVariableBinding < ApplicationRecord
  belongs_to :variable, class_name: "ExperienceBlockVariable"
  belongs_to :source_block, class_name: "ExperienceBlock"

  validates :variable_id, :source_block_id, presence: true
  validates :source_block_id, uniqueness: { scope: :variable_id }
  validate :source_block_visibility_subset_of_parent

  private

  def source_block_visibility_subset_of_parent
    return unless variable&.experience_block && source_block

    parent = variable.experience_block

    if source_block.visible_to_roles.present?
      invalid_roles = source_block.visible_to_roles - parent.visible_to_roles
      if invalid_roles.any?
        errors.add(:source_block, "has roles not present in parent: #{invalid_roles.join(', ')}")
      end
    end

    if source_block.visible_to_segments.present?
      invalid_segments = source_block.visible_to_segments - parent.visible_to_segments
      if invalid_segments.any?
        errors.add(:source_block, "has segments not present in parent: #{invalid_segments.join(', ')}")
      end
    end
  end
end
