class SwapExperienceBlockPositionIndex < ActiveRecord::Migration[7.2]
  def up
    remove_index :experience_blocks,
      name: "index_experience_blocks_on_position_scope_and_position",
      if_exists: true

    execute <<~SQL
      ALTER TABLE experience_blocks DROP COLUMN IF EXISTS position_scope;
    SQL

    add_index :experience_blocks,
      [:experience_id, :position],
      name: "index_experience_blocks_on_experience_id_and_position"
  end

  def down
    remove_index :experience_blocks,
      name: "index_experience_blocks_on_experience_id_and_position",
      if_exists: true

    execute <<~SQL
      ALTER TABLE experience_blocks
        ADD COLUMN position_scope uuid
        GENERATED ALWAYS AS (COALESCE(parent_block_id, experience_id)) STORED;
    SQL

    add_index :experience_blocks,
      [:position_scope, :position],
      name: "index_experience_blocks_on_position_scope_and_position"
  end
end
