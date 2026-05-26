class AddSourceToBlockLinkRelationship < ActiveRecord::Migration[7.2]
  def up
    execute <<~SQL
      ALTER TYPE block_link_relationship ADD VALUE IF NOT EXISTS 'source';
    SQL

    if index_exists?(:experience_block_links, :child_block_id, name: :idx_eb_links_unique_child)
      remove_index :experience_block_links, name: :idx_eb_links_unique_child
    end
  end

  def down
    add_index :experience_block_links, :child_block_id,
      unique: true, name: :idx_eb_links_unique_child

    execute <<~SQL
      ALTER TYPE block_link_relationship RENAME TO block_link_relationship_old;
      CREATE TYPE block_link_relationship AS ENUM ('depends_on');
      ALTER TABLE experience_block_links
        ALTER COLUMN relationship DROP DEFAULT;
      ALTER TABLE experience_block_links
        ALTER COLUMN relationship TYPE block_link_relationship
        USING relationship::text::block_link_relationship;
      ALTER TABLE experience_block_links
        ALTER COLUMN relationship SET DEFAULT 'depends_on'::block_link_relationship;
      DROP TYPE block_link_relationship_old;
    SQL
  end
end
