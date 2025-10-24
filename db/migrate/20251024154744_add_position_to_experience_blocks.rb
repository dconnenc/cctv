class AddPositionToExperienceBlocks < ActiveRecord::Migration[7.2]
  def change
    # Clear all existing blocks to start fresh
    reversible do |dir|
      dir.up do
        execute "DELETE FROM experience_blocks"
      end
    end

    # Add parent_block_id for easier querying and constraints
    add_column :experience_blocks, :parent_block_id, :uuid
    add_foreign_key :experience_blocks, :experience_blocks,
      column: :parent_block_id

    # Add position column
    add_column :experience_blocks, :position, :integer,
      null: false,
      default: 0

    # Unique position for parent blocks (scoped to experience)
    add_index :experience_blocks,
      [:experience_id, :position],
      unique: true,
      where: "parent_block_id IS NULL",
      name: "index_parent_blocks_unique_position"

    # Unique position for child blocks (scoped to parent)
    add_index :experience_blocks,
      [:parent_block_id, :position],
      unique: true,
      where: "parent_block_id IS NOT NULL",
      name: "index_child_blocks_unique_position"

    # Index for querying children
    add_index :experience_blocks, :parent_block_id

    # Remove position from experience_block_links (deprecated)
    remove_column :experience_block_links, :position, :integer
  end
end
