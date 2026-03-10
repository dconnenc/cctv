class AddPlaybillEnabledToExperiences < ActiveRecord::Migration[7.2]
  def change
    add_column :experiences, :playbill_enabled, :boolean, default: true, null: false
  end
end
