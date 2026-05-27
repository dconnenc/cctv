class AddSoundsToExperienceBlocks < ActiveRecord::Migration[7.2]
  def change
    add_column :experience_blocks, :sounds, :jsonb, default: {}, null: false
  end
end
