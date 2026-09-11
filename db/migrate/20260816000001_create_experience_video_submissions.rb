class CreateExperienceVideoSubmissions < ActiveRecord::Migration[7.2]
  def change
    create_table :experience_video_submissions, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :experience_block_id, null: false
      t.uuid :experience_participant_id, null: false
      t.jsonb :answer, null: false, default: {}
      t.timestamps
    end

    add_index :experience_video_submissions, :experience_block_id,
      name: "index_experience_video_submissions_on_block_id"
    add_index :experience_video_submissions, :experience_participant_id,
      name: "index_video_submissions_on_participant_id"

    add_foreign_key :experience_video_submissions, :experience_blocks, on_delete: :cascade
    add_foreign_key :experience_video_submissions, :experience_participants, on_delete: :cascade
  end
end
