class FixDataModelNaming < ActiveRecord::Migration[7.2]
  def up
    # Simple status to model states. For live events, a participant can be
    # created as active. Registered is a future proof status for supporting up
    # front registrations.
    create_enum :participant_status, [
      'registered',
      'active'
    ]

    create_table :experiences, id: :uuid do |t|
      t.string :name, null: false
      t.string :code, null: false

      t.timestamps
    end

    create_table :experience_participants, id: :uuid do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }, type: :uuid
      t.references :experience, null: false, foreign_key: { on_delete: :cascade }, type: :uuid

      t.enum :status, enum_type: :participant_status, null: false, default: 'registered'

      # When a participant moves from registered -> active.
      # This is technically behavioral state but seeing as we're already
      # tracking the status, keeping track of the time can live alongside it.
      t.timestamp :joined_at, null: true

      # Device identification for cookieless environments. This is a fallback if
      # for some reason we can't utilize cookies on a device.
      t.string :fingerprint, null: true

      t.timestamps
    end

    # Prevent duplicate user-experience relationships
    add_index :experience_participants, [:user_id, :experience_id], unique: true
    add_index :experience_participants, [:experience_id, :status]
    add_index :experience_participants, :fingerprint
  end

  def down
    drop_table :experience_participants
    drop_table :experiences
    drop_enum :participant_status
  end
end
