class CreateBlockDependencyEnums < ActiveRecord::Migration[7.2]
  def change
    create_enum :block_link_relationship, ["depends_on"]
    create_enum :block_variable_datatype, ["string", "number", "text"]
  end
end
