class AllowSyntheticQuestionSubmissions < ActiveRecord::Migration[7.2]
  def change
    change_column_null :experience_question_submissions, :experience_participant_id, true
    add_column :experience_question_submissions, :source, :string, null: false, default: "participant"
  end
end
