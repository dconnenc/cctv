RSpec.configure do |config|
  config.before(:suite) do
    superadmin_emails = ENV.delete("SUPERADMIN_EMAILS")
    begin
      Tenants::Sync.call
    ensure
      ENV["SUPERADMIN_EMAILS"] = superadmin_emails if superadmin_emails
    end
    ActsAsTenant.test_tenant = Tenant.default
  end

  config.after(:each) do
    ActsAsTenant.current_tenant = nil
  end
end

RSpec.shared_context "without ambient tenant" do
  around do |example|
    previous = ActsAsTenant.test_tenant
    ActsAsTenant.test_tenant = nil
    ActsAsTenant.current_tenant = nil
    example.run
  ensure
    ActsAsTenant.test_tenant = previous
  end
end
