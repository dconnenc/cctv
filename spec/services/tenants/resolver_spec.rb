require "rails_helper"

RSpec.describe Tenants::Resolver do
  let!(:other) { create(:tenant, key: "other") }

  before do
    allow(Tenants::Registry).to receive(:keys).and_return(%w[cctv other])
  end

  it "resolves the bare base domain to the default tenant" do
    expect(described_class.call("localhost")).to eq(Tenant.default)
  end

  it "resolves hosts outside the base domain to the default tenant" do
    ["127.0.0.1", "www.example.com", "myapp.fly.dev", "notlocalhost", ""].each do |host|
      expect(described_class.call(host)).to eq(Tenant.default), "expected #{host.inspect} to resolve to cctv"
    end
  end

  it "resolves a registered subdomain" do
    expect(described_class.call("other.localhost")).to eq(other)
  end

  it "normalizes case and a trailing dot" do
    expect(described_class.call("OTHER.Localhost.")).to eq(other)
  end

  it "treats www as the default tenant" do
    expect(described_class.call("www.localhost")).to eq(Tenant.default)
  end

  it "raises for an unregistered subdomain" do
    expect { described_class.call("nope.localhost") }.to raise_error(described_class::UnknownTenant)
  end

  it "raises for a multi-label subdomain" do
    expect { described_class.call("a.other.localhost") }.to raise_error(described_class::UnknownTenant)
  end

  it "raises for a key present in the database but missing from the registry" do
    create(:tenant, key: "ghost")

    expect { described_class.call("ghost.localhost") }.to raise_error(described_class::UnknownTenant)
  end
end
