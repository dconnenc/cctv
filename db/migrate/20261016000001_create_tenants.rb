class CreateTenants < ActiveRecord::Migration[7.2]
  def up
    create_table :tenants, id: :uuid do |t|
      t.string :key, null: false
      t.string :name, null: false
      t.timestamps
    end

    add_index :tenants, :key, unique: true
    add_check_constraint :tenants,
      "key ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'",
      name: "tenants_key_format"

    execute <<~SQL
      INSERT INTO tenants (key, name, created_at, updated_at)
      VALUES ('cctv', 'CCTV', now(), now())
    SQL
  end

  def down
    drop_table :tenants
  end
end
