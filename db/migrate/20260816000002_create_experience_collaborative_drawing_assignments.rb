class CreateExperienceCollaborativeDrawingAssignments < ActiveRecord::Migration[7.2]
  def change
    create_table :experience_collaborative_drawing_assignments, id: :uuid do |t|
      t.uuid :experience_block_id, null: false
      t.uuid :experience_participant_id, null: false
      t.uuid :source_photo_id
      t.integer :group_index, null: false
      t.integer :slice_index, null: false
      t.integer :slice_count, null: false
      t.text :drawing_image
      t.datetime :submitted_at

      t.timestamps
    end

    add_index :experience_collaborative_drawing_assignments, :experience_block_id,
      name: "index_collab_drawing_assignments_on_block_id"
    add_index :experience_collaborative_drawing_assignments, :experience_participant_id,
      name: "index_collab_drawing_assignments_on_participant_id"
    add_index :experience_collaborative_drawing_assignments,
      [:experience_block_id, :experience_participant_id],
      unique: true,
      name: "index_collab_drawing_assignments_unique"
    add_index :experience_collaborative_drawing_assignments,
      [:experience_block_id, :group_index, :slice_index],
      name: "index_collab_drawing_assignments_on_slot"
  end
end
