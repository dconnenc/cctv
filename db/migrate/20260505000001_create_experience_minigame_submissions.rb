class CreateExperienceMinigameSubmissions < ActiveRecord::Migration[7.2]
  def change
    create_table :experience_minigame_submissions, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :experience_block_id, null: false
      t.uuid :user_id, null: false
      t.integer :question_index, null: false
      t.string :submitted_answer
      t.boolean :correct, null: false, default: false
      t.datetime :submitted_at, null: false

      t.timestamps
    end

    add_index :experience_minigame_submissions, :experience_block_id
    add_index :experience_minigame_submissions, :user_id
    add_index :experience_minigame_submissions,
      [:experience_block_id, :user_id, :question_index],
      unique: true,
      name: "index_minigame_submissions_unique"

    add_foreign_key :experience_minigame_submissions, :experience_blocks, on_delete: :cascade
    add_foreign_key :experience_minigame_submissions, :users, on_delete: :cascade
  end
end
