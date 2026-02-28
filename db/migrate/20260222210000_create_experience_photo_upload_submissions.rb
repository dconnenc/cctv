class CreateExperiencePhotoUploadSubmissions < ActiveRecord::Migration[7.2]
  def change
    create_table :experience_photo_upload_submissions, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :experience_block_id, null: false
      t.uuid :user_id, null: false
      t.jsonb :answer, default: {}, null: false
      t.timestamps
    end

    add_index :experience_photo_upload_submissions, :experience_block_id,
      name: "index_experience_photo_upload_submissions_on_block_id"
    add_index :experience_photo_upload_submissions, :user_id,
      name: "index_experience_photo_upload_submissions_on_user_id"

    add_foreign_key :experience_photo_upload_submissions, :experience_blocks, on_delete: :cascade
    add_foreign_key :experience_photo_upload_submissions, :users, on_delete: :cascade
  end
end
