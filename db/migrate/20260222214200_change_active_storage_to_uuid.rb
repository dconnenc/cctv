class ChangeActiveStorageToUuid < ActiveRecord::Migration[7.2]
  def up
    # Remove the existing index and foreign key that depend on record_id
    remove_index :active_storage_attachments,
      name: :index_active_storage_attachments_uniqueness

    # Change record_id from bigint to uuid
    change_column :active_storage_attachments, :record_id, :uuid, null: false,
      using: "gen_random_uuid()"

    # Re-add the unique index
    add_index :active_storage_attachments,
      [:record_type, :record_id, :name, :blob_id],
      name: :index_active_storage_attachments_uniqueness,
      unique: true
  end

  def down
    remove_index :active_storage_attachments,
      name: :index_active_storage_attachments_uniqueness

    change_column :active_storage_attachments, :record_id, :bigint, null: false

    add_index :active_storage_attachments,
      [:record_type, :record_id, :name, :blob_id],
      name: :index_active_storage_attachments_uniqueness,
      unique: true
  end
end
