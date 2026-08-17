class AddCategoryAndBetaToCosmetics < ActiveRecord::Migration[7.2]
  def change
    add_column :cosmetics, :category, :string, null: false, default: "clothing"
    add_column :cosmetics, :beta_only, :boolean, null: false, default: false
    add_index :cosmetics, :category
  end
end
