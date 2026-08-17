class CreateCosmetics < ActiveRecord::Migration[7.2]
  def change
    create_table :cosmetics, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.string :kind, null: false
      t.string :asset_key, null: false
      t.jsonb :default_placement, null: false, default: {}
      t.integer :price_cents, null: false, default: 0
      t.boolean :default_grant, null: false, default: false
      t.boolean :active, null: false, default: true
      t.timestamps
    end

    add_index :cosmetics, :slug, unique: true
    add_index :cosmetics, :default_grant
  end
end
