class CreatePerformers < ActiveRecord::Migration[7.2]
  def change
    create_table :performers, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :user_id, null: false
      t.string :name, null: false
      t.text :bio
      t.string :slug, null: false

      t.timestamps
    end

    add_index :performers, :user_id, unique: true
    add_index :performers, :slug, unique: true
    add_foreign_key :performers, :users, on_delete: :cascade
  end
end
