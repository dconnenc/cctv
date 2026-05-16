class CreateImprovVotes < ActiveRecord::Migration[7.2]
  def change
    create_table :improv_votes, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :experience_block_id, null: false
      t.uuid :user_id, null: false
      t.uuid :improv_suggestion_id, null: false
      t.datetime :scene_started_at, null: false

      t.timestamps
    end

    add_index :improv_votes, :experience_block_id
    add_index :improv_votes, :user_id
    add_index :improv_votes, :improv_suggestion_id
    add_index :improv_votes,
      [:experience_block_id, :user_id, :scene_started_at],
      unique: true,
      name: "index_improv_votes_one_per_user_per_scene"
    add_index :improv_votes,
      [:experience_block_id, :scene_started_at, :improv_suggestion_id],
      name: "index_improv_votes_for_tally"

    add_foreign_key :improv_votes, :experience_blocks, on_delete: :cascade
    add_foreign_key :improv_votes, :users, on_delete: :cascade
    add_foreign_key :improv_votes, :improv_suggestions, on_delete: :cascade
  end
end
