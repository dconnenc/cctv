class MigrateSubmissionsToParticipantId < ActiveRecord::Migration[7.2]
  def up
    tables = %i[
      experience_poll_submissions
      experience_question_submissions
      experience_photo_upload_submissions
      experience_buzzer_submissions
      experience_minigame_submissions
      experience_minigame_balloon_results
      improv_suggestions
      improv_votes
    ]

    tables.each do |table|
      add_column table, :experience_participant_id, :uuid
    end

    tables.each do |table|
      execute <<~SQL
        UPDATE #{table} s
        SET experience_participant_id = ep.id
        FROM experience_participants ep
        JOIN experience_blocks eb ON eb.id = s.experience_block_id
        WHERE ep.user_id = s.user_id
          AND ep.experience_id = eb.experience_id
      SQL
    end

    tables.each do |table|
      execute "DELETE FROM #{table} WHERE experience_participant_id IS NULL"
    end

    # Poll submissions
    change_column_null :experience_poll_submissions, :experience_participant_id, false
    remove_foreign_key :experience_poll_submissions, :users
    remove_index :experience_poll_submissions, name: "index_experience_poll_submissions_on_user_id"
    remove_column :experience_poll_submissions, :user_id
    add_index :experience_poll_submissions, :experience_participant_id,
      name: "index_poll_submissions_on_participant_id"
    add_foreign_key :experience_poll_submissions, :experience_participants, on_delete: :cascade

    # Question submissions
    change_column_null :experience_question_submissions, :experience_participant_id, false
    remove_foreign_key :experience_question_submissions, :users
    remove_index :experience_question_submissions, name: "index_experience_question_submissions_on_user_id"
    remove_column :experience_question_submissions, :user_id
    add_index :experience_question_submissions, :experience_participant_id,
      name: "index_question_submissions_on_participant_id"
    add_foreign_key :experience_question_submissions, :experience_participants, on_delete: :cascade

    # Photo upload submissions
    change_column_null :experience_photo_upload_submissions, :experience_participant_id, false
    remove_foreign_key :experience_photo_upload_submissions, :users
    remove_index :experience_photo_upload_submissions, name: "index_experience_photo_upload_submissions_on_user_id"
    remove_column :experience_photo_upload_submissions, :user_id
    add_index :experience_photo_upload_submissions, :experience_participant_id,
      name: "index_photo_upload_submissions_on_participant_id"
    add_foreign_key :experience_photo_upload_submissions, :experience_participants, on_delete: :cascade

    # Buzzer submissions
    change_column_null :experience_buzzer_submissions, :experience_participant_id, false
    remove_index :experience_buzzer_submissions, name: "index_buzzer_submissions_on_block_and_user"
    remove_foreign_key :experience_buzzer_submissions, :users
    remove_index :experience_buzzer_submissions, name: "index_experience_buzzer_submissions_on_user_id"
    remove_column :experience_buzzer_submissions, :user_id
    add_index :experience_buzzer_submissions, [:experience_block_id, :experience_participant_id],
      name: "index_buzzer_submissions_on_block_and_participant", unique: true
    add_index :experience_buzzer_submissions, :experience_participant_id,
      name: "index_buzzer_submissions_on_participant_id"
    add_foreign_key :experience_buzzer_submissions, :experience_participants, on_delete: :cascade

    # Minigame submissions
    change_column_null :experience_minigame_submissions, :experience_participant_id, false
    remove_index :experience_minigame_submissions, name: "index_minigame_submissions_unique"
    remove_foreign_key :experience_minigame_submissions, :users
    remove_index :experience_minigame_submissions, name: "index_experience_minigame_submissions_on_user_id"
    remove_column :experience_minigame_submissions, :user_id
    add_index :experience_minigame_submissions,
      [:experience_block_id, :experience_participant_id, :question_index],
      name: "index_minigame_submissions_unique", unique: true
    add_index :experience_minigame_submissions, :experience_participant_id,
      name: "index_minigame_submissions_on_participant_id"
    add_foreign_key :experience_minigame_submissions, :experience_participants, on_delete: :cascade

    # Minigame balloon results
    change_column_null :experience_minigame_balloon_results, :experience_participant_id, false
    remove_index :experience_minigame_balloon_results, name: "index_balloon_results_unique"
    remove_foreign_key :experience_minigame_balloon_results, :users
    remove_index :experience_minigame_balloon_results, name: "index_experience_minigame_balloon_results_on_user_id"
    remove_column :experience_minigame_balloon_results, :user_id
    add_index :experience_minigame_balloon_results,
      [:experience_block_id, :experience_participant_id],
      name: "index_balloon_results_unique", unique: true
    add_index :experience_minigame_balloon_results, :experience_participant_id,
      name: "index_balloon_results_on_participant_id"
    add_foreign_key :experience_minigame_balloon_results, :experience_participants, on_delete: :cascade

    # Improv suggestions
    change_column_null :improv_suggestions, :experience_participant_id, false
    remove_index :improv_suggestions, name: "index_improv_suggestions_one_active_per_user"
    remove_foreign_key :improv_suggestions, :users
    remove_index :improv_suggestions, name: "index_improv_suggestions_on_user_id"
    remove_column :improv_suggestions, :user_id
    add_index :improv_suggestions, [:experience_block_id, :experience_participant_id],
      name: "index_improv_suggestions_one_active_per_participant",
      unique: true,
      where: "cleared_at IS NULL"
    add_index :improv_suggestions, :experience_participant_id,
      name: "index_improv_suggestions_on_participant_id"
    add_foreign_key :improv_suggestions, :experience_participants, on_delete: :cascade

    # Improv votes
    change_column_null :improv_votes, :experience_participant_id, false
    remove_index :improv_votes, name: "index_improv_votes_one_per_user_per_scene"
    remove_foreign_key :improv_votes, :users
    remove_index :improv_votes, name: "index_improv_votes_on_user_id"
    remove_column :improv_votes, :user_id
    add_index :improv_votes,
      [:experience_block_id, :experience_participant_id, :scene_started_at],
      name: "index_improv_votes_one_per_participant_per_scene", unique: true
    add_index :improv_votes, :experience_participant_id,
      name: "index_improv_votes_on_participant_id"
    add_foreign_key :improv_votes, :experience_participants, on_delete: :cascade
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
