class CreateExperienceMinigameBalloonResults < ActiveRecord::Migration[7.2]
  def change
    create_table :experience_minigame_balloon_results, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :experience_block_id, null: false
      t.uuid :user_id, null: false
      t.integer :fill_amount, null: false, default: 0

      t.timestamps
    end

    add_index :experience_minigame_balloon_results, :experience_block_id
    add_index :experience_minigame_balloon_results, :user_id
    add_index :experience_minigame_balloon_results,
      [:experience_block_id, :user_id],
      unique: true,
      name: "index_balloon_results_unique"
    add_index :experience_minigame_balloon_results,
      [:experience_block_id, :fill_amount],
      order: { fill_amount: :desc },
      name: "index_balloon_results_by_fill"

    add_foreign_key :experience_minigame_balloon_results, :experience_blocks, on_delete: :cascade
    add_foreign_key :experience_minigame_balloon_results, :users, on_delete: :cascade
  end
end
