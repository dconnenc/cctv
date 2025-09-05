class AddStartedFieldsToSessions < ActiveRecord::Migration[7.2]
  def change
    add_column :sessions, :started, :boolean, default: false, null: false
    add_column :sessions, :start_url, :string
  end
end

