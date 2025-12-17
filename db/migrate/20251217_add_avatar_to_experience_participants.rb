class AddAvatarToExperienceParticipants < ActiveRecord::Migration[7.2]
  def change
    add_column :experience_participants, :avatar, :jsonb, null: false, default: {}
    add_index  :experience_participants, :avatar, using: :gin
  end
end

