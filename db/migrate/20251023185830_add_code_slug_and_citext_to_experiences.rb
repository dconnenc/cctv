class AddCodeSlugAndCitextToExperiences < ActiveRecord::Migration[7.2]
  def up
    # Add code_slug column without null constraint initially
    add_column :experiences, :code_slug, :string

    # Generate code_slug for existing records
    # This will create URL-safe slugs from existing codes
    execute <<-SQL
      UPDATE experiences
      SET code_slug = trim(both '-' from lower(
        regexp_replace(
          regexp_replace(code, '[^a-zA-Z0-9-]', '-', 'g'),
          '-+', '-', 'g'
        )
      ))
    SQL

    # Now add the not null constraint and unique index
    change_column_null :experiences, :code_slug, false
    add_index :experiences, :code_slug, unique: true

    # Change code column to citext for case-insensitive storage
    change_column :experiences, :code, :citext, null: false
  end

  def down
    # Change code column back to string
    change_column :experiences, :code, :string, null: false

    # Remove code_slug column
    remove_index :experiences, :code_slug
    remove_column :experiences, :code_slug
  end
end
