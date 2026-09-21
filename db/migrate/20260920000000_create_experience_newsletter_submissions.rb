class CreateExperienceNewsletterSubmissions < ActiveRecord::Migration[7.2]
  def change
    create_table :experience_newsletter_submissions, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :experience_block, null: false, foreign_key: { on_delete: :cascade }, type: :uuid
      t.references :experience_participant, null: false, foreign_key: { on_delete: :cascade }, type: :uuid
      t.jsonb :answer, null: false, default: {}
      t.timestamps
    end

    add_index :experience_newsletter_submissions,
      [:experience_block_id, :experience_participant_id],
      unique: true,
      name: "index_newsletter_submissions_on_block_and_participant"
  end
end
