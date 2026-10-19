require "rails_helper"

RSpec.describe "Tenant propagation through ActiveJob" do
  let(:other) { create(:tenant) }

  before do
    stub_const("TenantProbeJob", Class.new(ApplicationJob) do
      cattr_accessor :seen_tenant_key, :seen_user_count, :seen_user

      def perform(user = nil)
        self.class.seen_user = user
        self.class.seen_tenant_key = ActsAsTenant.current_tenant&.key
        self.class.seen_user_count = User.count
      end
    end)
  end

  def without_ambient_tenant
    previous = ActsAsTenant.test_tenant
    ActsAsTenant.test_tenant = nil
    ActsAsTenant.current_tenant = nil
    yield
  ensure
    ActsAsTenant.test_tenant = previous
  end

  it "serializes the enqueuing tenant" do
    data = ActsAsTenant.with_tenant(other) { TenantProbeJob.new.serialize }

    expect(data["current_tenant"]).to eq(other.to_global_id.to_s)
  end

  it "performs in the enqueuing tenant even with no ambient tenant" do
    ActsAsTenant.with_tenant(other) { create_list(:user, 3) }
    ActsAsTenant.with_tenant(Tenant.default) { create_list(:user, 2) }
    data = ActsAsTenant.with_tenant(other) { TenantProbeJob.new.serialize }

    without_ambient_tenant { ActiveJob::Base.execute(data) }

    expect(TenantProbeJob.seen_tenant_key).to eq(other.key)
    expect(TenantProbeJob.seen_user_count).to eq(3)
  end

  it "locates GlobalID arguments inside the enqueuing tenant" do
    user = ActsAsTenant.with_tenant(other) { create(:user) }
    data = ActsAsTenant.with_tenant(other) { TenantProbeJob.new(user).serialize }

    without_ambient_tenant { ActiveJob::Base.execute(data) }

    expect(TenantProbeJob.seen_user).to eq(user)
  end

  it "does not let a job see records from another tenant" do
    ActsAsTenant.with_tenant(other) { create_list(:user, 3) }
    ActsAsTenant.with_tenant(Tenant.default) { create_list(:user, 2) }
    data = TenantProbeJob.new.serialize

    ActsAsTenant.with_tenant(other) { ActiveJob::Base.execute(data) }

    expect(TenantProbeJob.seen_tenant_key).to eq(Tenant.default.key)
    expect(TenantProbeJob.seen_user_count).to eq(2)
    expect(ActsAsTenant.with_tenant(other) { User.count }).to eq(3)
  end

  it "fails closed when the job has no tenant" do
    data = without_ambient_tenant { TenantProbeJob.new.serialize }

    expect(data["current_tenant"]).to be_nil
    without_ambient_tenant do
      ActsAsTenant.with_tenant(other) do
        expect { ActiveJob::Base.execute(data) }.to raise_error(ActsAsTenant::Errors::NoTenantSet)
      end
    end
  end

  it "restores the ambient tenant after performing" do
    data = ActsAsTenant.with_tenant(other) { TenantProbeJob.new.serialize }

    ActiveJob::Base.execute(data)

    expect(ActsAsTenant.current_tenant).to eq(Tenant.default)
  end
end
