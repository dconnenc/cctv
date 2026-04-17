class DropOldPositionIndexes < ActiveRecord::Migration[7.2]
  def up
    remove_index :experience_blocks, name: "index_parent_blocks_unique_position", if_exists: true
    remove_index :experience_blocks, name: "index_child_blocks_unique_position", if_exists: true
  end

  def down
    add_index :experience_blocks,
      [:experience_id, :position],
      unique: true,
      where: "parent_block_id IS NULL",
      name: "index_parent_blocks_unique_position"

    add_index :experience_blocks,
      [:parent_block_id, :position],
      unique: true,
      where: "parent_block_id IS NOT NULL",
      name: "index_child_blocks_unique_position"
  end
end
