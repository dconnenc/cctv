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
