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

ActiveRecord::Schema[7.2].define(version: 2025_11_11_152004) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "citext"
  enable_extension "plpgsql"

  # Custom types defined in this database.
  # Note that some types may not work with other database engines. Be careful if changing database.
  create_enum "block_link_relationship", ["depends_on"]
  create_enum "block_variable_datatype", ["string", "number", "text"]
  create_enum "experience_block_statuses", ["hidden", "open", "closed"]
  create_enum "experience_participant_roles", ["audience", "player", "moderator", "host"]
  create_enum "experience_statuses", ["draft", "lobby", "live", "paused", "finished", "archived"]
  create_enum "participant_status", ["registered", "active"]
  create_enum "user_roles", ["user", "admin", "superadmin"]

  create_table "experience_block_links", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "parent_block_id", null: false
    t.uuid "child_block_id", null: false
    t.enum "relationship", default: "depends_on", null: false, enum_type: "block_link_relationship"
    t.jsonb "meta", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["child_block_id"], name: "idx_eb_links_unique_child", unique: true
    t.index ["child_block_id"], name: "index_experience_block_links_on_child_block_id"
    t.index ["parent_block_id", "child_block_id"], name: "idx_eb_links_parent_child", unique: true
    t.index ["parent_block_id"], name: "index_experience_block_links_on_parent_block_id"
  end

  create_table "experience_block_variable_bindings", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "variable_id", null: false
    t.uuid "source_block_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["source_block_id"], name: "index_experience_block_variable_bindings_on_source_block_id"
    t.index ["variable_id", "source_block_id"], name: "idx_eb_var_bind_unique", unique: true
    t.index ["variable_id"], name: "index_experience_block_variable_bindings_on_variable_id"
  end

  create_table "experience_block_variables", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "experience_block_id", null: false
    t.string "key", null: false
    t.string "label", null: false
    t.enum "datatype", default: "string", null: false, enum_type: "block_variable_datatype"
    t.boolean "required", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["experience_block_id", "key"], name: "idx_eb_vars_block_key", unique: true
    t.index ["experience_block_id"], name: "index_experience_block_variables_on_experience_block_id"
  end

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
    t.uuid "parent_block_id"
    t.integer "position", default: 0, null: false
    t.boolean "show_in_lobby", default: false, null: false
    t.index ["experience_id", "position"], name: "index_parent_blocks_unique_position", unique: true, where: "(parent_block_id IS NULL)"
    t.index ["experience_id", "status"], name: "index_experience_blocks_on_experience_id_and_status"
    t.index ["experience_id"], name: "index_experience_blocks_on_experience_id"
    t.index ["kind"], name: "index_experience_blocks_on_kind"
    t.index ["parent_block_id", "position"], name: "index_child_blocks_unique_position", unique: true, where: "(parent_block_id IS NOT NULL)"
    t.index ["parent_block_id"], name: "index_experience_blocks_on_parent_block_id"
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
    t.string "name", null: false
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
    t.citext "code", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "creator_id", null: false
    t.enum "status", default: "draft", null: false, enum_type: "experience_statuses"
    t.boolean "join_open", default: false, null: false
    t.datetime "started_at"
    t.datetime "ended_at"
    t.text "description"
    t.string "code_slug", null: false
    t.index ["code_slug"], name: "index_experiences_on_code_slug", unique: true
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

  add_foreign_key "experience_block_links", "experience_blocks", column: "child_block_id", on_delete: :cascade
  add_foreign_key "experience_block_links", "experience_blocks", column: "parent_block_id", on_delete: :cascade
  add_foreign_key "experience_block_variable_bindings", "experience_block_variables", column: "variable_id", on_delete: :cascade
  add_foreign_key "experience_block_variable_bindings", "experience_blocks", column: "source_block_id", on_delete: :cascade
  add_foreign_key "experience_block_variables", "experience_blocks", on_delete: :cascade
  add_foreign_key "experience_blocks", "experience_blocks", column: "parent_block_id"
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
