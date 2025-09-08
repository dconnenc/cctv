# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2025_09_08_185043) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  # Custom types defined in this database.
  # Note that some types may not work with other database engines. Be careful if changing database.
  create_enum "participant_status", ["registered", "active"]

  create_table "experience_participants", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "experience_id", null: false
    t.enum "status", default: "registered", null: false, enum_type: "participant_status"
    t.datetime "joined_at", precision: nil
    t.string "fingerprint"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["experience_id", "status"], name: "index_experience_participants_on_experience_id_and_status"
    t.index ["experience_id"], name: "index_experience_participants_on_experience_id"
    t.index ["fingerprint"], name: "index_experience_participants_on_fingerprint"
    t.index ["user_id", "experience_id"], name: "index_experience_participants_on_user_id_and_experience_id", unique: true
    t.index ["user_id"], name: "index_experience_participants_on_user_id"
  end

  create_table "experiences", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "experience_participants", "experiences", on_delete: :cascade
  add_foreign_key "experience_participants", "users", on_delete: :cascade
end
