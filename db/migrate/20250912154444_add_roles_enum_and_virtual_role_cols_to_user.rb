class AddRolesEnumAndVirtualRoleColsToUser < ActiveRecord::Migration[7.2]
  def change
    create_enum "user_roles", ["user", "admin", "superadmin"]

    add_column :users,
      :role, :enum,
      enum_type: "user_roles",
      default: "user",
      null: false

    admin_sql = <<~SQL
      CASE
          WHEN (role = 'admin'::user_roles) THEN true
          ELSE false
      END
    SQL

    super_admin_sql = <<~SQL
      CASE
          WHEN (role = 'superadmin'::user_roles) THEN true
          ELSE false
      END
    SQL

    add_column :users,
      :admin,
      :virtual,
      type: :boolean,
      as: admin_sql,
      stored: true

    add_column :users,
      :super_admin,
      :virtual,
      type: :boolean,
      as: super_admin_sql,
      stored: true
  end

  def down
    remove_column :users, :super_admin
    remove_column :users, :admin
    remove_column :users, :role
    drop_enum "user_roles"
  end
end
