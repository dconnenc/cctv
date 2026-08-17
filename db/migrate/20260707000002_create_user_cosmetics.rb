class CreateUserCosmetics < ActiveRecord::Migration[7.2]
  def change
    create_table :user_cosmetics, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :user_id, null: false
      t.uuid :cosmetic_id, null: false
      t.datetime :acquired_at, null: false
      t.string :source, null: false, default: "grant"
      t.timestamps
    end

    add_index :user_cosmetics, [:user_id, :cosmetic_id], unique: true
    add_index :user_cosmetics, :cosmetic_id
    add_foreign_key :user_cosmetics, :users, on_delete: :cascade
    add_foreign_key :user_cosmetics, :cosmetics, on_delete: :cascade
  end
end
