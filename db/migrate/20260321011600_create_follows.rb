class CreateFollows < ActiveRecord::Migration[7.2]
  def change
    create_table :follows, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :user_id, null: false
      t.uuid :performer_id, null: false

      t.timestamps
    end

    add_index :follows, [:user_id, :performer_id], unique: true
    add_index :follows, :performer_id
    add_foreign_key :follows, :users, on_delete: :cascade
    add_foreign_key :follows, :performers, on_delete: :cascade
  end
end
