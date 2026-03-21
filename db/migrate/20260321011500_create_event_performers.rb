class CreateEventPerformers < ActiveRecord::Migration[7.2]
  def change
    create_table :event_performers, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :event_id, null: false
      t.uuid :performer_id, null: false
      t.integer :position, default: 0, null: false

      t.timestamps
    end

    add_index :event_performers, [:event_id, :performer_id], unique: true
    add_index :event_performers, :performer_id
    add_foreign_key :event_performers, :events, on_delete: :cascade
    add_foreign_key :event_performers, :performers, on_delete: :cascade
  end
end
