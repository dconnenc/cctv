class CreateExperienceCollaborativeDrawingPhotos < ActiveRecord::Migration[7.2]
  def change
    create_table :experience_collaborative_drawing_photos, id: :uuid do |t|
      t.uuid :experience_block_id, null: false
      t.uuid :experience_participant_id, null: false
      t.jsonb :answer, default: {}, null: false

      t.timestamps
    end

    add_index :experience_collaborative_drawing_photos, :experience_block_id,
      name: "index_collab_drawing_photos_on_block_id"
    add_index :experience_collaborative_drawing_photos, :experience_participant_id,
      name: "index_collab_drawing_photos_on_participant_id"
    add_index :experience_collaborative_drawing_photos,
      [:experience_block_id, :experience_participant_id],
      unique: true,
      name: "index_collab_drawing_photos_unique"
  end
end
