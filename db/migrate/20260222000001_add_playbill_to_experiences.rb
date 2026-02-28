class AddPlaybillToExperiences < ActiveRecord::Migration[7.2]
  def change
    add_column :experiences, :playbill, :jsonb, default: [], null: false
  end
end
