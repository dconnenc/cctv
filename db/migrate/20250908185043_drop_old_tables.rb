class DropOldTables < ActiveRecord::Migration[7.2]
  def up
    drop_table :session_participants
    drop_table :sessions
  end

  def down
    create_table :sessions, id: :uuid do |t|
      t.string :code, null: false
      t.timestamps
    end

    # Join table for users participating in sessions
    create_table :session_participants, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :session, null: false, foreign_key: true, type: :uuid
      t.string :fingerprint, null: false
      t.timestamps
    end

    add_index :sessions, :code, unique: true
    add_index :session_participants, [:user_id, :session_id], unique: true
    add_index :session_participants, [:session_id, :fingerprint]
  end
end
