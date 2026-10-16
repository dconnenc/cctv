require "rails_helper"

RSpec.describe Tenant do
  before { Tenants::Sync.call }

  it "has a default tenant" do
    expect(described_class.default.key).to eq("cctv")
    expect(described_class.default).to be_default
  end

  it "rejects invalid keys" do
    expect(build(:tenant, key: "Bad_Key")).not_to be_valid
    expect(build(:tenant, key: "a.b")).not_to be_valid
  end

  it "rejects duplicate keys" do
    create(:tenant, key: "dup")

    expect(build(:tenant, key: "dup")).not_to be_valid
  end

  it "returns its registered config" do
    expect(described_class.default.config).to eq(Tenants::Registry.default)
  end

  it "raises when no config is registered" do
    tenant = create(:tenant, key: "unregistered")

    expect { tenant.config }.to raise_error(Tenants::Registry::UnknownTenant)
  end
end
