class CreateImprovSuggestions < ActiveRecord::Migration[7.2]
  def change
    create_table :improv_suggestions, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :experience_block_id, null: false
      t.uuid :user_id, null: false
      t.text :text, null: false
      t.datetime :cleared_at

      t.timestamps
    end

    add_index :improv_suggestions, :experience_block_id
    add_index :improv_suggestions, :user_id
    add_index :improv_suggestions,
      [:experience_block_id, :user_id],
      where: "cleared_at IS NULL",
      unique: true,
      name: "index_improv_suggestions_one_active_per_user"

    add_foreign_key :improv_suggestions, :experience_blocks, on_delete: :cascade
    add_foreign_key :improv_suggestions, :users, on_delete: :cascade
  end
end
