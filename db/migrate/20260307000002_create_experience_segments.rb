class CreateExperienceSegments < ActiveRecord::Migration[7.2]
  def change
    create_table :experience_segments, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :experience_id, null: false
      t.string :name, null: false
      t.string :color, null: false, default: '#6B7280'
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :experience_segments, [:experience_id, :name], unique: true
    add_index :experience_segments, [:experience_id, :position]
    add_foreign_key :experience_segments, :experiences, on_delete: :cascade
  end
end
