class CreateFeedbacks < ActiveRecord::Migration[7.2]
  def up
    create_enum "feedback_types", ["bug", "experience", "general", "other"]
    create_enum "feedback_sources", ["manual", "error", "block"]
    create_enum "feedback_sync_statuses", ["pending", "synced", "failed", "skipped"]

    create_table :feedbacks, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :user_id, null: true
      t.uuid :experience_id, null: true
      t.uuid :experience_participant_id, null: true
      t.uuid :experience_block_id, null: true

      t.enum :feedback_type, enum_type: "feedback_types", null: false, default: "general"
      t.enum :source, enum_type: "feedback_sources", null: false, default: "manual"

      t.string :title, null: true
      t.text :description, null: true

      # Page, experience, segment and device state captured at submission time.
      t.jsonb :context, null: false, default: {}
      # Redacted client console ring buffer.
      t.jsonb :console_logs, null: false, default: []

      # Set for source=error. Repeat occurrences of the same fingerprint roll up
      # into the first feedback rather than minting a new Linear issue.
      t.string :error_fingerprint, null: true
      t.integer :occurrence_count, null: false, default: 1

      # When set, this feedback is a child of another feedback's Linear issue and
      # syncs as a comment instead of a new issue.
      t.uuid :linear_parent_feedback_id, null: true

      t.enum :sync_status, enum_type: "feedback_sync_statuses", null: false, default: "pending"
      t.text :sync_error, null: true
      t.string :linear_issue_id, null: true
      t.string :linear_issue_identifier, null: true
      t.string :linear_issue_url, null: true
      t.datetime :linear_synced_at, null: true

      t.timestamps
    end

    add_index :feedbacks, :user_id
    add_index :feedbacks, :experience_id
    add_index :feedbacks, :experience_block_id
    add_index :feedbacks, :sync_status
    add_index :feedbacks, [:error_fingerprint, :created_at]
    add_index :feedbacks, :linear_parent_feedback_id

    add_foreign_key :feedbacks, :users, on_delete: :nullify
    add_foreign_key :feedbacks, :experiences, on_delete: :cascade
    add_foreign_key :feedbacks, :experience_participants, on_delete: :nullify
    add_foreign_key :feedbacks, :experience_blocks, column: :experience_block_id, on_delete: :cascade
    add_foreign_key :feedbacks, :feedbacks, column: :linear_parent_feedback_id, on_delete: :nullify
  end

  def down
    drop_table :feedbacks
    drop_enum :feedback_sync_statuses
    drop_enum :feedback_sources
    drop_enum :feedback_types
  end
end
