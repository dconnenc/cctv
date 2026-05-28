class AddPlaybillFieldsToExperienceBlocks < ActiveRecord::Migration[7.2]
  def change
    add_column :experience_blocks, :add_to_playbill, :boolean, default: false, null: false
    add_column :experience_blocks, :playbill_mysterious, :boolean, default: false, null: false
  end
end
