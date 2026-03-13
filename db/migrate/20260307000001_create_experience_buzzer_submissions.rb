class CreateExperienceBuzzerSubmissions < ActiveRecord::Migration[7.1]
  def change
    create_table :experience_buzzer_submissions, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :experience_block, null: false, foreign_key: { on_delete: :cascade }, type: :uuid
      t.references :user, null: false, foreign_key: { on_delete: :cascade }, type: :uuid
      t.jsonb :answer, null: false, default: {}
      t.timestamps
    end

    add_index :experience_buzzer_submissions, [:experience_block_id, :user_id], unique: true,
      name: "index_buzzer_submissions_on_block_and_user"
  end
end
