class ReplacePositionIndexesWithDeferred < ActiveRecord::Migration[7.2]
  def up
    remove_index :experience_blocks, name: "index_parent_blocks_unique_position", if_exists: true
    remove_index :experience_blocks, name: "index_child_blocks_unique_position", if_exists: true

    execute <<~SQL
      ALTER TABLE experience_blocks
        ADD COLUMN position_scope uuid
        GENERATED ALWAYS AS (COALESCE(parent_block_id, experience_id)) STORED;

      ALTER TABLE experience_blocks
        ADD CONSTRAINT unique_position_in_scope
        UNIQUE (position_scope, position)
        DEFERRABLE INITIALLY DEFERRED;
    SQL
  end

  def down
    execute <<~SQL
      ALTER TABLE experience_blocks DROP CONSTRAINT unique_position_in_scope;
      ALTER TABLE experience_blocks DROP COLUMN position_scope;
    SQL

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
