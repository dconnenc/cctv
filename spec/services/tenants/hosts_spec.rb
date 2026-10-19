require "rails_helper"

RSpec.describe Tenants::Hosts do
  let(:other) { build(:tenant, key: "other") }

  around do |example|
    original_url = Rails.configuration.x.tenants.base_url
    example.run
  ensure
    Rails.configuration.x.tenants.base_url = original_url
  end

  it "reads the configured base url" do
    expect(described_class.base_url).to eq("http://localhost")
  end

  it "derives the base domain from the base url host" do
    Rails.configuration.x.tenants.base_url = "https://chicagocomedy.tv"

    expect(described_class.base_domain).to eq("chicagocomedy.tv")
  end

  it "builds subdomain hosts for non-default tenants" do
    expect(described_class.host_for(other)).to eq("other.localhost")
  end

  it "keeps the default tenant on the bare base domain" do
    expect(described_class.host_for(Tenant.default)).to eq("localhost")
  end

  it "returns the unchanged base url for the default tenant" do
    Rails.configuration.x.tenants.base_url = "https://chicagocomedy.tv"

    expect(described_class.url_for(Tenant.default)).to eq("https://chicagocomedy.tv")
  end

  it "keeps an explicit port in the default tenant url" do
    Rails.configuration.x.tenants.base_url = "http://localhost:5200"

    expect(described_class.url_for(Tenant.default)).to eq("http://localhost:5200")
  end

  it "drops a trailing slash from the default tenant url" do
    Rails.configuration.x.tenants.base_url = "https://chicagocomedy.tv/"

    expect(described_class.url_for(Tenant.default)).to eq("https://chicagocomedy.tv")
  end

  it "builds a tenant url preserving scheme and port" do
    Rails.configuration.x.tenants.base_url = "http://localhost:5200"

    expect(described_class.url_for(other)).to eq("http://other.localhost:5200")
  end

  it "omits the default port" do
    Rails.configuration.x.tenants.base_url = "https://localhost"

    expect(described_class.url_for(other)).to eq("https://other.localhost")
  end

  describe ".mailer_options" do
    it "uses the base domain and scheme for the default tenant" do
      Rails.configuration.x.tenants.base_url = "https://chicagocomedy.tv"

      expect(described_class.mailer_options(Tenant.default)).to eq(host: "chicagocomedy.tv", protocol: "https")
    end

    it "uses the tenant subdomain and keeps an explicit port" do
      Rails.configuration.x.tenants.base_url = "http://localhost:5200"

      expect(described_class.mailer_options(other)).to eq(host: "other.localhost", protocol: "http", port: 5200)
    end
  end

  describe ".validate!" do
    it "accepts an apex url with a scheme" do
      Rails.configuration.x.tenants.base_url = "https://chicagocomedy.tv"

      expect(described_class.validate!).to be(true)
    end

    it "rejects a blank setting" do
      Rails.configuration.x.tenants.base_url = ""

      expect { described_class.validate! }.to raise_error(ArgumentError, /not set/)
    end

    it "rejects a url without a scheme" do
      Rails.configuration.x.tenants.base_url = "chicagocomedy.tv"

      expect { described_class.validate! }.to raise_error(ArgumentError, /must include a scheme/)
    end

    it "accepts a trailing slash and an explicit port" do
      Rails.configuration.x.tenants.base_url = "http://localhost:5200/"

      expect(described_class.validate!).to be(true)
    end

    [
      "https://chicagocomedy.tv/app",
      "https://chicagocomedy.tv?ref=x",
      "https://chicagocomedy.tv#top",
      "https://user:pass@chicagocomedy.tv",
    ].each do |url|
      it "rejects #{url}" do
        Rails.configuration.x.tenants.base_url = url

        expect { described_class.validate! }.to raise_error(ArgumentError, /only a scheme, host and optional port/)
      end
    end

    it "rejects a www host" do
      Rails.configuration.x.tenants.base_url = "https://www.chicagocomedy.tv"

      expect { described_class.validate! }.to raise_error(ArgumentError, /www\./)
    end
  end
end
