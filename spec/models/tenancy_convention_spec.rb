require "rails_helper"

RSpec.describe "tenancy convention" do
  let(:exempt_tables) do
    %w[
      tenants
      active_storage_attachments
      active_storage_blobs
      active_storage_variant_records
      passwordless_sessions
      schema_migrations
      ar_internal_metadata
    ]
  end

  let(:plain_foreign_keys) do
    [
      %w[events experience_id],
      %w[experiences default_segment_id],
      %w[feedbacks experience_participant_id],
      %w[feedbacks linear_parent_feedback_id],
      %w[feedbacks user_id],
    ]
  end

  let(:connection) { ActiveRecord::Base.connection }
  let(:tenanted_tables) { connection.tables - exempt_tables }

  it "puts a NOT NULL tenant_id referencing tenants on every non-exempt table" do
    offenders = tenanted_tables.reject do |table|
      column = connection.columns(table).find { |c| c.name == "tenant_id" }
      tenant_fk = connection.foreign_keys(table).any? do |fk|
        fk.to_table == "tenants" && fk.column == "tenant_id"
      end

      column && !column.null && tenant_fk
    end

    expect(offenders).to eq([])
  end

  it "includes Tenanted in every model on a tenanted table" do
    Rails.application.eager_load!

    offenders = ApplicationRecord.descendants.reject(&:abstract_class?).filter_map do |model|
      next unless model.table_exists?
      next if exempt_tables.include?(model.table_name)

      model.name unless model.include?(Tenanted)
    end

    expect(offenders).to eq([])
  end

  it "makes every FK between tenanted tables composite except the documented ones" do
    offenders = tenanted_tables.flat_map do |table|
      connection.foreign_keys(table).filter_map do |fk|
        next if fk.to_table == "tenants"
        next if exempt_tables.include?(fk.to_table)
        next if Array(fk.column).include?("tenant_id")
        next if plain_foreign_keys.include?([table, fk.column])

        "#{table}.#{fk.column} -> #{fk.to_table}"
      end
    end

    expect(offenders).to eq([])
  end

  it "keeps the documented plain foreign keys plain" do
    plain_foreign_keys.each do |table, column|
      fk = connection.foreign_keys(table).find { |f| f.column == column }
      expect(fk).to be_present, "#{table}.#{column} should still be a plain foreign key"
    end
  end
end
