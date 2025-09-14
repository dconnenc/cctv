class AddEmailToUsers < ActiveRecord::Migration[7.2]
  def change
    # citext is a case insensitive data type. This allows us to consider emails:
    # "X@y.com" and "x@y.com" as the same at the database level
    enable_extension 'citext'

    add_column :users, :email, :citext, null: false
    add_index :users, :email, unique: true
  end
end
