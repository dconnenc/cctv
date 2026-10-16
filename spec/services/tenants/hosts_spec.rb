require "rails_helper"

RSpec.describe Tenants::Hosts do
  let(:other) { build(:tenant, key: "other") }

  around do |example|
    original_domain = Rails.configuration.x.tenants.base_domain
    original_url = Rails.configuration.app_base_url
    example.run
  ensure
    Rails.configuration.x.tenants.base_domain = original_domain
    Rails.configuration.app_base_url = original_url
  end

  it "reads the configured base domain" do
    expect(described_class.base_domain).to eq("localhost")
  end

  it "falls back to the app base url host" do
    Rails.configuration.x.tenants.base_domain = nil

    expect(described_class.base_domain).to eq(URI(Rails.configuration.app_base_url).host)
  end

  it "builds subdomain hosts for non-default tenants" do
    expect(described_class.host_for(other)).to eq("other.localhost")
  end

  it "keeps the default tenant on the bare base domain" do
    expect(described_class.host_for(Tenant.default)).to eq("localhost")
  end

  it "returns the unchanged app base url for the default tenant" do
    expect(described_class.url_for(Tenant.default)).to eq(Rails.configuration.app_base_url)
  end

  it "builds a tenant url preserving scheme and port" do
    Rails.configuration.app_base_url = "http://localhost:5200"

    expect(described_class.url_for(other)).to eq("http://other.localhost:5200")
  end

  it "omits the default port" do
    Rails.configuration.app_base_url = "https://localhost"

    expect(described_class.url_for(other)).to eq("https://other.localhost")
  end
end
