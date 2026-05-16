class DropMadLibTables < ActiveRecord::Migration[7.2]
  def change
    drop_table :experience_block_variable_bindings, force: :cascade
    drop_table :experience_block_variables, force: :cascade
    drop_table :experience_mad_lib_submissions, force: :cascade
  end
end
