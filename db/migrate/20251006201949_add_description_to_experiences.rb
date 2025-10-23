class AddDescriptionToExperiences < ActiveRecord::Migration[7.2]
  def change
    add_column :experiences, :description, :text
  end
end
