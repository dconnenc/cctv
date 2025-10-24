class AddNameToExperienceParticipants < ActiveRecord::Migration[7.2]
  def change
    ExperienceParticipant.delete_all
    add_column :experience_participants, :name, :string, null: false
  end
end
