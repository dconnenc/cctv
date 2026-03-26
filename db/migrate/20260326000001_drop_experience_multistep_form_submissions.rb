class DropExperienceMultistepFormSubmissions < ActiveRecord::Migration[7.2]
  def change
    drop_table :experience_multistep_form_submissions, id: :uuid do |t|
      t.uuid "experience_block_id", null: false
      t.uuid "user_id", null: false
      t.jsonb "answer", default: {}, null: false
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end
  end
end
