class SimplifyUserRolesToAdminOnly < ActiveRecord::Migration[7.2]
  def up
    execute <<~SQL
      UPDATE users SET role = 'admin'::user_roles WHERE role = 'superadmin'::user_roles;
    SQL

    execute <<~SQL
      ALTER TYPE user_roles RENAME TO user_roles_old;
    SQL

    execute <<~SQL
      CREATE TYPE user_roles AS ENUM ('user', 'admin');
    SQL

    execute <<~SQL
      ALTER TABLE users
      ALTER COLUMN role TYPE user_roles
      USING role::text::user_roles;
    SQL

    execute <<~SQL
      DROP TYPE user_roles_old;
    SQL

    execute <<~SQL
      ALTER TABLE users DROP COLUMN IF EXISTS super_admin;
    SQL
  end

  def down
    execute <<~SQL
      ALTER TYPE user_roles RENAME TO user_roles_old;
    SQL

    execute <<~SQL
      CREATE TYPE user_roles AS ENUM ('user', 'admin', 'superadmin');
    SQL

    execute <<~SQL
      ALTER TABLE users
      ALTER COLUMN role TYPE user_roles
      USING role::text::user_roles;
    SQL

    execute <<~SQL
      DROP TYPE user_roles_old;
    SQL

    execute <<~SQL
      ALTER TABLE users
      ADD COLUMN super_admin boolean
      GENERATED ALWAYS AS (
        CASE
          WHEN (role = 'superadmin'::user_roles) THEN true
          ELSE false
        END
      ) STORED;
    SQL
  end
end

