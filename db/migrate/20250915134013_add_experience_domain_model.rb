class AddExperienceDomainModel < ActiveRecord::Migration[7.2]
  def up
    create_enum(
      "experience_participant_roles",
      ["audience", "player", "moderator", "host"]
    )

    add_column :experience_participants,
      :role,
      :enum,
      enum_type: "experience_participant_roles",
      default: "audience",
      null: false
    add_index :experience_participants, :role

    add_column :experience_participants,
      :segments,
      :string,
      array: true,
      default: [],
      null: false
    add_index :experience_participants, :segments, using: :gin

    create_enum(
      "experience_statuses",
      ["draft", "lobby", "live", "paused", "finished", "archived"]
    )

    add_column :experiences,
      :status,
      :enum,
      enum_type: "experience_statuses",
      default: "draft",
      null: false

    add_column :experiences, :join_open, :boolean, null: false, default: false
    add_column :experiences, :started_at, :datetime, null: true
    add_column :experiences, :ended_at, :datetime, null: true

    add_index :experiences, :status

    create_enum(
      "experience_block_statuses",
      ["hidden", "open", "closed"]
    )

    create_table :experience_blocks, id: :uuid do |t|
      t.references :experience, null: false, foreign_key: { on_delete: :cascade }, type: :uuid # set destroy here

      # "type" is reserved. This is a non-db enforced enum for types of
      # experience elements: poll, questionaire, announcement, etc
      t.string :kind, null: false

      # Allows creation in hidden state, and 2 basic states that apply to any
      # block: is this open or closed?
      t.enum :status, enum_type: "experience_block_statuses", null: false, default: "hidden"

      # block specific payload (poll options, constraints, etc)
      t.jsonb :payload, null: false, default: {}

      # which roles can see this block ("player", "audience")
      # This gates blocks at a role level
      #
      # Not sure if you can enforce the enum here at a db level
      t.string :visible_to_roles, array: true, default: []

      # which segements can see this block ("front row", "vip", etc)
      t.string :visible_to_segments, array: true, default: []

      # Specific users to target
      t.uuid :target_user_ids, array: true, default: [], null: false

      t.timestamps
    end

    # Querying open, closed, hiddeen blocks
    add_index :experience_blocks, [:experience_id, :status]
    add_index :experience_blocks, :kind

    # Querying visibility
    add_index :experience_blocks, :visible_to_roles,    using: :gin
    add_index :experience_blocks, :visible_to_segments, using: :gin
    add_index :experience_blocks, :target_user_ids,     using: :gin
  end

  def down
    drop_table :experience_blocks

    remove_column :experiences, :ended_at
    remove_column :experiences, :started_at
    remove_column :experiences, :join_open
    remove_index  :experiences, :status
    remove_column :experiences, :status

    remove_column :experience_participants, :segments
    remove_index  :experience_participants, :role
    remove_column :experience_participants, :role

    drop_enum "experience_block_statuses"
    drop_enum "experience_statuses"
    drop_enum "experience_participant_roles"
  end
end
