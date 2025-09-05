class AddSessionAndUserTables < ActiveRecord::Migration[7.2]
  def change
    create_table :users, id: :uuid do |t|
      t.string :name, null: false
      t.timestamps
    end

    create_table :sessions, id: :uuid do |t|
      t.string :code, null: false
      t.timestamps
    end

    # Join table for users participating in sessions
    create_table :session_participants, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :session, null: false, foreign_key: true, type: :uuid
      t.timestamps
    end

    add_index :sessions, :code, unique: true
    add_index :session_participants, [:user_id, :session_id], unique: true
  end
end
