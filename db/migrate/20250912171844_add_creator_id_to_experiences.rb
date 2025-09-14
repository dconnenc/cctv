class AddCreatorIdToExperiences < ActiveRecord::Migration[7.2]
  def change
    add_reference :experiences,
      :creator,
      null: false,
      type: :uuid,
      foreign_key: { to_table: :users, on_delete: :cascade },
      index: true
  end
end
