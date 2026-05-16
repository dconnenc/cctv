class AddDefaultSegmentToExperiences < ActiveRecord::Migration[7.2]
  def change
    add_reference :experiences,
      :default_segment,
      type: :uuid,
      foreign_key: { to_table: :experience_segments, on_delete: :nullify },
      null: true
  end
end
