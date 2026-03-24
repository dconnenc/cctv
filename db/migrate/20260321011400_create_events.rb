class CreateEvents < ActiveRecord::Migration[7.2]
  def change
    create_table :events, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :title, null: false
      t.text :description
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.string :venue_name
      t.string :venue_address
      t.string :pricing_text
      t.string :ticket_url
      t.uuid :experience_id
      t.uuid :creator_id, null: false
      t.string :slug, null: false
      t.boolean :published, default: false, null: false

      t.timestamps
    end

    add_index :events, :slug, unique: true
    add_index :events, :starts_at
    add_index :events, [:published, :starts_at]
    add_index :events, :experience_id
    add_index :events, :creator_id
    add_foreign_key :events, :experiences, on_delete: :nullify
    add_foreign_key :events, :users, column: :creator_id, on_delete: :cascade
  end
end
