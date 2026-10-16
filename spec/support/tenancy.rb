RSpec.configure do |config|
  config.before(:suite) do
    Tenants::Sync.call
    ActsAsTenant.test_tenant = Tenant.default
  end

  config.after(:each) do
    ActsAsTenant.current_tenant = nil
  end
end
