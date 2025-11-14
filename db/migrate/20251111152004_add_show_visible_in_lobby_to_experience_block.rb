class AddShowVisibleInLobbyToExperienceBlock < ActiveRecord::Migration[7.2]
  def change
    add_column :experience_blocks, :show_in_lobby, :boolean, default: false, null: false
  end
end
