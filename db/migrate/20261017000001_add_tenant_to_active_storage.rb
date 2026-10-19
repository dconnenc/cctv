class AddTenantToActiveStorage < ActiveRecord::Migration[7.2]
  TABLES = %w[active_storage_blobs active_storage_attachments active_storage_variant_records].freeze

  def up
    default_tenant_id = select_value("SELECT id FROM tenants WHERE key = 'cctv'")
    raise "tenants row for cctv is missing" if default_tenant_id.nil?

    TABLES.each do |table|
      add_column table, :tenant_id, :uuid
      execute "UPDATE #{quote_table_name(table)} SET tenant_id = #{quote(default_tenant_id)}"
      change_column_null table, :tenant_id, false
      add_index table, :tenant_id
      add_foreign_key table, :tenants, on_delete: :restrict
    end

    add_index :active_storage_blobs, [:tenant_id, :id], unique: true, name: "index_active_storage_blobs_on_tenant_id_and_id"

    remove_foreign_key :active_storage_attachments, column: :blob_id
    add_foreign_key :active_storage_attachments, :active_storage_blobs,
      column: [:tenant_id, :blob_id], primary_key: [:tenant_id, :id]

    remove_foreign_key :active_storage_variant_records, column: :blob_id
    add_foreign_key :active_storage_variant_records, :active_storage_blobs,
      column: [:tenant_id, :blob_id], primary_key: [:tenant_id, :id]
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
