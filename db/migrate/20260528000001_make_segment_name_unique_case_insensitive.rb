class MakeSegmentNameUniqueCaseInsensitive < ActiveRecord::Migration[7.2]
  def up
    change_column :experience_segments, :name, :citext, null: false
  end

  def down
    change_column :experience_segments, :name, :string, null: false
  end
end
