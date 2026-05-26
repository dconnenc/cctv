class AddPositionToExperienceBlockLinks < ActiveRecord::Migration[7.2]
  def change
    add_column :experience_block_links, :position, :integer, null: false, default: 0
    add_index :experience_block_links, [:parent_block_id, :relationship, :position],
      name: :idx_eb_links_parent_rel_pos
  end
end
