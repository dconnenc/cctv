require "rails_helper"

RSpec.describe TenantMailerUrlOptions do
  let(:mailer) { Passwordless::Mailer.new }

  before do
    allow(Passwordless::Mailer).to receive(:default_url_options).and_return(host: "example.com", protocol: "https")
  end

  it "leaves the default tenant's options unchanged" do
    expect(mailer.default_url_options).to include(host: "example.com", protocol: "https")
  end

  it "uses the tenant subdomain for other tenants" do
    other = create(:tenant, key: "other")

    ActsAsTenant.with_tenant(other) do
      expect(mailer.default_url_options).to include(host: "other.localhost", protocol: "https")
    end
  end
end
