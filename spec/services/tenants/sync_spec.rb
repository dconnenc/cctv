require "rails_helper"

RSpec.describe Tenants::Sync do
  it "creates a row for every registered config" do
    described_class.call

    expect(Tenant.pluck(:key)).to include(*Tenants::Registry.keys)
  end

  it "is idempotent and refreshes names" do
    described_class.call
    Tenant.default.update!(name: "stale")

    expect { described_class.call }.not_to change(Tenant, :count)
    expect(Tenant.default.name).to eq("CCTV")
  end

  it "leaves every registered tenant row with a config" do
    described_class.call

    Tenant.where(key: Tenants::Registry.keys).find_each do |tenant|
      expect { tenant.config }.not_to raise_error
    end
  end
end
