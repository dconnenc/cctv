require "rails_helper"

RSpec.describe TenantMailerUrlOptions do
  let(:mailer) { Passwordless::Mailer.new }

  around do |example|
    original_url = Rails.configuration.x.tenants.base_url
    Rails.configuration.x.tenants.base_url = "https://chicagocomedy.tv"
    example.run
  ensure
    Rails.configuration.x.tenants.base_url = original_url
  end

  it "uses the base domain for the default tenant" do
    ActsAsTenant.with_tenant(Tenant.default) do
      expect(mailer.default_url_options).to include(host: "chicagocomedy.tv", protocol: "https")
    end
  end

  it "uses the tenant subdomain for other tenants" do
    other = create(:tenant, key: "other")

    ActsAsTenant.with_tenant(other) do
      expect(mailer.default_url_options).to include(host: "other.chicagocomedy.tv", protocol: "https")
    end
  end

  describe "sign-in link" do
    def magic_link_for(tenant)
      ActsAsTenant.with_tenant(tenant) do
        user = create(:user)
        session = Passwordless::Session.create!(authenticatable: user)
        Passwordless::Mailer.sign_in(session).message.body.to_s[%r{https?://\S+}]
      end
    end

    it "points at the default tenant's host" do
      link = magic_link_for(Tenant.default)

      expect(link).to start_with(Tenants::Hosts.url_for(Tenant.default))
    end

    it "points at a non-default tenant's host" do
      other = create(:tenant, key: "other")
      link = magic_link_for(other)

      expect(link).to start_with("https://other.chicagocomedy.tv/")
      expect(link).to start_with(Tenants::Hosts.url_for(other))
    end
  end

  it "raises when there is no current tenant" do
    ActsAsTenant.without_tenant do
      expect { mailer.default_url_options }.to raise_error(ActsAsTenant::Errors::NoTenantSet)
    end
  end
end
