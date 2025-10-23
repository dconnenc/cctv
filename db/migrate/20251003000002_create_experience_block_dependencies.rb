class CreateExperienceBlockDependencies < ActiveRecord::Migration[7.2]
  def change
    create_table :experience_block_links, id: :uuid do |t|
      t.references :parent_block, type: :uuid, null: false,
        foreign_key: { to_table: :experience_blocks, on_delete: :cascade }
      t.references :child_block, type: :uuid, null: false,
        foreign_key: { to_table: :experience_blocks, on_delete: :cascade }
      t.enum :relationship, enum_type: :block_link_relationship,
        null: false, default: "depends_on"
      t.integer :position, null: false, default: 0
      t.jsonb :meta, null: false, default: {}
      t.timestamps
    end

    add_index :experience_block_links, [:parent_block_id, :child_block_id],
      unique: true, name: :idx_eb_links_parent_child
    add_index :experience_block_links, :child_block_id,
      unique: true, name: :idx_eb_links_unique_child

    create_table :experience_block_variables, id: :uuid do |t|
      t.references :experience_block, type: :uuid, null: false,
        foreign_key: { on_delete: :cascade }
      t.string :key, null: false
      t.string :label, null: false
      t.enum :datatype, enum_type: :block_variable_datatype,
        null: false, default: "string"
      t.boolean :required, null: false, default: true
      t.timestamps
    end

    add_index :experience_block_variables, [:experience_block_id, :key],
      unique: true, name: :idx_eb_vars_block_key

    create_table :experience_block_variable_bindings, id: :uuid do |t|
      t.references :variable, type: :uuid, null: false,
        foreign_key: { to_table: :experience_block_variables, on_delete: :cascade }
      t.references :source_block, type: :uuid, null: false,
        foreign_key: { to_table: :experience_blocks, on_delete: :cascade }
      t.timestamps
    end

    add_index :experience_block_variable_bindings, [:variable_id, :source_block_id],
      unique: true, name: :idx_eb_var_bind_unique
  end
end
