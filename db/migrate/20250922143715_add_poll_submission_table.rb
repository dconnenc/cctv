class AddPollSubmissionTable < ActiveRecord::Migration[7.2]
  def change
    create_table :experience_poll_submissions, id: :uuid do |t|
      t.references :experience_block, null: false, foreign_key: { on_delete: :cascade }, type: :uuid
      t.references :user, null: false, foreign_key: { on_delete: :cascade }, type: :uuid
      t.jsonb :answer, null: false, default: {}
      t.timestamps
    end
  end
end
