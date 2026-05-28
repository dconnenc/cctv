class FlattenBlockPositions < ActiveRecord::Migration[7.2]
  def up
    remove_index :experience_blocks,
      name: "index_experience_blocks_on_position_scope_and_position",
      if_exists: true

    execute <<~SQL
      ALTER TABLE experience_blocks DROP COLUMN IF EXISTS position_scope;
    SQL

    add_index :experience_blocks, [:experience_id, :position],
      name: "index_experience_blocks_on_experience_id_and_position"

    backfill_positions
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

    add_index :experience_blocks, [:position_scope, :position],
      name: "index_experience_blocks_on_position_scope_and_position"
  end

  private

  def backfill_positions
    ExperienceBlock.connection.execute(<<~SQL)
      WITH ordered AS (
        SELECT
          b.id,
          ROW_NUMBER() OVER (
            PARTITION BY b.experience_id
            ORDER BY
              COALESCE(p.position, b.position) ASC,
              CASE WHEN b.parent_block_id IS NULL THEN 0 ELSE 1 END ASC,
              b.position ASC,
              b.created_at ASC
          ) - 1 AS new_position
        FROM experience_blocks b
        LEFT JOIN experience_blocks p ON p.id = b.parent_block_id
      )
      UPDATE experience_blocks
      SET position = ordered.new_position
      FROM ordered
      WHERE experience_blocks.id = ordered.id
    SQL
  end
end
