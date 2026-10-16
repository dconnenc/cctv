class AddTenantScoping < ActiveRecord::Migration[7.2]
  TENANTED_TABLES = %w[
    cosmetics
    event_performers
    events
    experience_block_links
    experience_block_segments
    experience_blocks
    experience_buzzer_submissions
    experience_collaborative_drawing_assignments
    experience_collaborative_drawing_photos
    experience_minigame_balloon_results
    experience_minigame_submissions
    experience_newsletter_submissions
    experience_participant_segments
    experience_participants
    experience_photo_upload_submissions
    experience_poll_submissions
    experience_question_submissions
    experience_segments
    experiences
    feedbacks
    follows
    improv_suggestions
    improv_votes
    performers
    user_cosmetics
    users
  ].freeze

  FK_TARGET_TABLES = %w[
    users
    experiences
    experience_blocks
    experience_participants
    experience_segments
    events
    performers
    cosmetics
    improv_suggestions
  ].freeze

  UNIQUE_SWAPS = [
    ["users", "email", "index_users_on_email"],
    ["experiences", "code_slug", "index_experiences_on_code_slug"],
    ["events", "slug", "index_events_on_slug"],
    ["performers", "slug", "index_performers_on_slug"],
    ["cosmetics", "slug", "index_cosmetics_on_slug"],
  ].freeze

  # [child table, fk column, parent table, on_delete]
  COMPOSITE_FKS = [
    ["event_performers", "event_id", "events", :cascade],
    ["event_performers", "performer_id", "performers", :cascade],
    ["events", "creator_id", "users", :cascade],
    ["experience_block_links", "child_block_id", "experience_blocks", :cascade],
    ["experience_block_links", "parent_block_id", "experience_blocks", :cascade],
    ["experience_block_segments", "experience_block_id", "experience_blocks", :cascade],
    ["experience_block_segments", "experience_segment_id", "experience_segments", :cascade],
    ["experience_blocks", "parent_block_id", "experience_blocks", nil],
    ["experience_blocks", "experience_id", "experiences", :cascade],
    ["experience_buzzer_submissions", "experience_block_id", "experience_blocks", :cascade],
    ["experience_buzzer_submissions", "experience_participant_id", "experience_participants", :cascade],
    ["experience_minigame_balloon_results", "experience_block_id", "experience_blocks", :cascade],
    ["experience_minigame_balloon_results", "experience_participant_id", "experience_participants", :cascade],
    ["experience_minigame_submissions", "experience_block_id", "experience_blocks", :cascade],
    ["experience_minigame_submissions", "experience_participant_id", "experience_participants", :cascade],
    ["experience_newsletter_submissions", "experience_block_id", "experience_blocks", :cascade],
    ["experience_newsletter_submissions", "experience_participant_id", "experience_participants", :cascade],
    ["experience_participant_segments", "experience_participant_id", "experience_participants", :cascade],
    ["experience_participant_segments", "experience_segment_id", "experience_segments", :cascade],
    ["experience_participants", "experience_id", "experiences", :cascade],
    ["experience_participants", "user_id", "users", :cascade],
    ["experience_photo_upload_submissions", "experience_block_id", "experience_blocks", :cascade],
    ["experience_photo_upload_submissions", "experience_participant_id", "experience_participants", :cascade],
    ["experience_poll_submissions", "experience_block_id", "experience_blocks", :cascade],
    ["experience_poll_submissions", "experience_participant_id", "experience_participants", :cascade],
    ["experience_question_submissions", "experience_block_id", "experience_blocks", :cascade],
    ["experience_question_submissions", "experience_participant_id", "experience_participants", :cascade],
    ["experience_segments", "experience_id", "experiences", :cascade],
    ["experiences", "creator_id", "users", :cascade],
    ["feedbacks", "experience_block_id", "experience_blocks", :cascade],
    ["feedbacks", "experience_id", "experiences", :cascade],
    ["follows", "performer_id", "performers", :cascade],
    ["follows", "user_id", "users", :cascade],
    ["improv_suggestions", "experience_block_id", "experience_blocks", :cascade],
    ["improv_suggestions", "experience_participant_id", "experience_participants", :cascade],
    ["improv_votes", "experience_block_id", "experience_blocks", :cascade],
    ["improv_votes", "experience_participant_id", "experience_participants", :cascade],
    ["improv_votes", "improv_suggestion_id", "improv_suggestions", :cascade],
    ["performers", "user_id", "users", :cascade],
    ["user_cosmetics", "cosmetic_id", "cosmetics", :cascade],
    ["user_cosmetics", "user_id", "users", :cascade],
  ].freeze

  def up
    default_tenant_id = select_value("SELECT id FROM tenants WHERE key = 'cctv'")
    raise "tenants row for cctv is missing" if default_tenant_id.nil?

    TENANTED_TABLES.each do |table|
      add_column table, :tenant_id, :uuid
      execute "UPDATE #{quote_table_name(table)} SET tenant_id = #{quote(default_tenant_id)}"
      change_column_null table, :tenant_id, false
      add_index table, :tenant_id
      add_foreign_key table, :tenants, on_delete: :restrict
    end

    FK_TARGET_TABLES.each do |table|
      add_index table, [:tenant_id, :id], unique: true, name: "index_#{table}_on_tenant_id_and_id"
    end

    UNIQUE_SWAPS.each do |table, column, old_index|
      remove_index table, name: old_index
      add_index table, [:tenant_id, column], unique: true
    end
    add_index :experiences, [:tenant_id, :code], unique: true

    COMPOSITE_FKS.each do |child, column, parent, on_delete|
      remove_foreign_key child, column: column
      options = { column: [:tenant_id, column], primary_key: [:tenant_id, :id] }
      options[:on_delete] = on_delete if on_delete
      add_foreign_key child, parent, **options
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
