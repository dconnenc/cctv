class AddMissingIndex < ActiveRecord::Migration[7.2]
  def change
    remove_index :experience_segments, name: "index_experience_segments_on_experience_id_and_position"
    add_index :experience_segments, [:experience_id, :position],
      unique: true,
      name: "index_experience_segments_on_experience_id_and_position"
  end
end
