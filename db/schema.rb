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

ActiveRecord::Schema[7.2].define(version: 2025_09_28_183953) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "citext"
  enable_extension "plpgsql"

  # Custom types defined in this database.
  # Note that some types may not work with other database engines. Be careful if changing database.
  create_enum "experience_block_statuses", ["hidden", "open", "closed"]
  create_enum "experience_participant_roles", ["audience", "player", "moderator", "host"]
  create_enum "experience_statuses", ["draft", "lobby", "live", "paused", "finished", "archived"]
  create_enum "participant_status", ["registered", "active"]
  create_enum "user_roles", ["user", "admin", "superadmin"]

  create_table "experience_blocks", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "experience_id", null: false
    t.string "kind", null: false
    t.enum "status", default: "hidden", null: false, enum_type: "experience_block_statuses"
    t.jsonb "payload", default: {}, null: false
    t.string "visible_to_roles", default: [], array: true
    t.string "visible_to_segments", default: [], array: true
    t.uuid "target_user_ids", default: [], null: false, array: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["experience_id", "status"], name: "index_experience_blocks_on_experience_id_and_status"
    t.index ["experience_id"], name: "index_experience_blocks_on_experience_id"
    t.index ["kind"], name: "index_experience_blocks_on_kind"
    t.index ["target_user_ids"], name: "index_experience_blocks_on_target_user_ids", using: :gin
    t.index ["visible_to_roles"], name: "index_experience_blocks_on_visible_to_roles", using: :gin
    t.index ["visible_to_segments"], name: "index_experience_blocks_on_visible_to_segments", using: :gin
  end

  create_table "experience_mad_lib_submissions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "experience_block_id", null: false
    t.uuid "user_id", null: false
    t.jsonb "answer", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["experience_block_id"], name: "index_experience_mad_lib_submissions_on_experience_block_id"
    t.index ["user_id"], name: "index_experience_mad_lib_submissions_on_user_id"
  end

  create_table "experience_multistep_form_submissions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "experience_block_id", null: false
    t.uuid "user_id", null: false
    t.jsonb "answer", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["experience_block_id"], name: "idx_on_experience_block_id_3cadb23df3"
    t.index ["user_id"], name: "index_experience_multistep_form_submissions_on_user_id"
  end

  create_table "experience_participants", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "experience_id", null: false
    t.enum "status", default: "registered", null: false, enum_type: "participant_status"
    t.datetime "joined_at", precision: nil
    t.string "fingerprint"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.enum "role", default: "audience", null: false, enum_type: "experience_participant_roles"
    t.string "segments", default: [], null: false, array: true
    t.index ["experience_id", "status"], name: "index_experience_participants_on_experience_id_and_status"
    t.index ["experience_id"], name: "index_experience_participants_on_experience_id"
    t.index ["fingerprint"], name: "index_experience_participants_on_fingerprint"
    t.index ["role"], name: "index_experience_participants_on_role"
    t.index ["segments"], name: "index_experience_participants_on_segments", using: :gin
    t.index ["user_id", "experience_id"], name: "index_experience_participants_on_user_id_and_experience_id", unique: true
    t.index ["user_id"], name: "index_experience_participants_on_user_id"
  end

  create_table "experience_poll_submissions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "experience_block_id", null: false
    t.uuid "user_id", null: false
    t.jsonb "answer", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["experience_block_id"], name: "index_experience_poll_submissions_on_experience_block_id"
    t.index ["user_id"], name: "index_experience_poll_submissions_on_user_id"
  end

  create_table "experience_question_submissions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "experience_block_id", null: false
    t.uuid "user_id", null: false
    t.jsonb "answer", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["experience_block_id"], name: "index_experience_question_submissions_on_experience_block_id"
    t.index ["user_id"], name: "index_experience_question_submissions_on_user_id"
  end

  create_table "experiences", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "creator_id", null: false
    t.enum "status", default: "draft", null: false, enum_type: "experience_statuses"
    t.boolean "join_open", default: false, null: false
    t.datetime "started_at"
    t.datetime "ended_at"
    t.index ["creator_id"], name: "index_experiences_on_creator_id"
    t.index ["status"], name: "index_experiences_on_status"
  end

  create_table "passwordless_sessions", force: :cascade do |t|
    t.string "authenticatable_type"
    t.uuid "authenticatable_id"
    t.datetime "timeout_at", precision: nil, null: false
    t.datetime "expires_at", precision: nil, null: false
    t.datetime "claimed_at", precision: nil
    t.string "token_digest", null: false
    t.string "identifier", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["authenticatable_type", "authenticatable_id"], name: "authenticatable"
    t.index ["identifier"], name: "index_passwordless_sessions_on_identifier", unique: true
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.citext "email", null: false
    t.enum "role", default: "user", null: false, enum_type: "user_roles"
    t.virtual "admin", type: :boolean, as: "\nCASE\n    WHEN (role = 'admin'::user_roles) THEN true\n    ELSE false\nEND", stored: true
    t.virtual "super_admin", type: :boolean, as: "\nCASE\n    WHEN (role = 'superadmin'::user_roles) THEN true\n    ELSE false\nEND", stored: true
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "experience_blocks", "experiences", on_delete: :cascade
  add_foreign_key "experience_mad_lib_submissions", "experience_blocks", on_delete: :cascade
  add_foreign_key "experience_mad_lib_submissions", "users", on_delete: :cascade
  add_foreign_key "experience_multistep_form_submissions", "experience_blocks", on_delete: :cascade
  add_foreign_key "experience_multistep_form_submissions", "users", on_delete: :cascade
  add_foreign_key "experience_participants", "experiences", on_delete: :cascade
  add_foreign_key "experience_participants", "users", on_delete: :cascade
  add_foreign_key "experience_poll_submissions", "experience_blocks", on_delete: :cascade
  add_foreign_key "experience_poll_submissions", "users", on_delete: :cascade
  add_foreign_key "experience_question_submissions", "experience_blocks", on_delete: :cascade
  add_foreign_key "experience_question_submissions", "users", on_delete: :cascade
  add_foreign_key "experiences", "users", column: "creator_id", on_delete: :cascade
end
