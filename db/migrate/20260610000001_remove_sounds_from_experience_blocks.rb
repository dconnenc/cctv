class RemoveSoundsFromExperienceBlocks < ActiveRecord::Migration[7.2]
  def change
    remove_column :experience_blocks, :sounds, :jsonb, default: {}, null: false
  end
end
