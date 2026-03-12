class CreateSegmentJoinTables < ActiveRecord::Migration[7.2]
  def up
    # Create join table for participant <-> segment
    create_table :experience_participant_segments, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :experience_participant, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.references :experience_segment, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.timestamps
    end
    add_index :experience_participant_segments,
      [:experience_participant_id, :experience_segment_id],
      unique: true,
      name: 'idx_participant_segments_unique'

    # Create join table for block <-> segment
    create_table :experience_block_segments, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :experience_block, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.references :experience_segment, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.timestamps
    end
    add_index :experience_block_segments,
      [:experience_block_id, :experience_segment_id],
      unique: true,
      name: 'idx_block_segments_unique'

    # Migrate existing participant segment data
    execute <<~SQL
      INSERT INTO experience_participant_segments (id, experience_participant_id, experience_segment_id, created_at, updated_at)
      SELECT
        gen_random_uuid(),
        ep.id,
        es.id,
        NOW(),
        NOW()
      FROM experience_participants ep
      CROSS JOIN LATERAL unnest(ep.segments) AS segment_name
      JOIN experience_segments es
        ON es.experience_id = ep.experience_id
        AND es.name = segment_name
      WHERE ep.segments IS NOT NULL
        AND array_length(ep.segments, 1) > 0
    SQL

    # Migrate existing block segment data
    execute <<~SQL
      INSERT INTO experience_block_segments (id, experience_block_id, experience_segment_id, created_at, updated_at)
      SELECT
        gen_random_uuid(),
        eb.id,
        es.id,
        NOW(),
        NOW()
      FROM experience_blocks eb
      CROSS JOIN LATERAL unnest(eb.visible_to_segments) AS segment_name
      JOIN experience_segments es
        ON es.experience_id = eb.experience_id
        AND es.name = segment_name
      WHERE eb.visible_to_segments IS NOT NULL
        AND array_length(eb.visible_to_segments, 1) > 0
    SQL

    # Drop old columns
    remove_column :experience_participants, :segments
    remove_column :experience_blocks, :visible_to_segments
  end

  def down
    # Re-add old columns
    add_column :experience_participants, :segments, :string, array: true, default: []
    add_column :experience_blocks, :visible_to_segments, :string, array: true, default: []

    # Migrate data back to arrays
    execute <<~SQL
      UPDATE experience_participants ep
      SET segments = (
        SELECT COALESCE(array_agg(es.name), '{}')
        FROM experience_participant_segments eps
        JOIN experience_segments es ON es.id = eps.experience_segment_id
        WHERE eps.experience_participant_id = ep.id
      )
    SQL

    execute <<~SQL
      UPDATE experience_blocks eb
      SET visible_to_segments = (
        SELECT COALESCE(array_agg(es.name), '{}')
        FROM experience_block_segments ebs
        JOIN experience_segments es ON es.id = ebs.experience_segment_id
        WHERE ebs.experience_block_id = eb.id
      )
    SQL

    # Drop join tables
    drop_table :experience_block_segments
    drop_table :experience_participant_segments
  end
end
