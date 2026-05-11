class AllowDuplicateBlockPositions < ActiveRecord::Migration[7.2]
  def up
    execute <<~SQL
      ALTER TABLE experience_blocks DROP CONSTRAINT IF EXISTS unique_position_in_scope;
    SQL

    add_index :experience_blocks,
      [:position_scope, :position],
      name: "index_experience_blocks_on_position_scope_and_position"
  end

  def down
    remove_index :experience_blocks,
      name: "index_experience_blocks_on_position_scope_and_position",
      if_exists: true

    execute <<~SQL
      ALTER TABLE experience_blocks
        ADD CONSTRAINT unique_position_in_scope
        UNIQUE (position_scope, position)
        DEFERRABLE INITIALLY DEFERRED;
    SQL
  end
end
