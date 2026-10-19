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

  describe "superadmin provisioning" do
    around do |example|
      original = ENV["SUPERADMIN_EMAILS"]
      ENV["SUPERADMIN_EMAILS"] = " Boss@Example.com ,ops@example.com "
      example.run
    ensure
      ENV["SUPERADMIN_EMAILS"] = original
    end

    it "creates each superadmin in every tenant" do
      described_class.call

      Tenant.where(key: Tenants::Registry.keys).find_each do |tenant|
        ActsAsTenant.with_tenant(tenant) do
          expect(User.superadmin.pluck(:email)).to include("boss@example.com", "ops@example.com")
        end
      end
    end

    it "defaults the name to the email local part" do
      described_class.call

      expect(User.find_by!(email: "ops@example.com").name).to eq("ops")
    end

    it "promotes an existing user and stays idempotent" do
      user = create(:user, email: "ops@example.com", role: :user)

      expect { 2.times { described_class.call } }.not_to change { User.where(email: "ops@example.com").count }
      expect(user.reload).to be_superadmin
    end

    it "keeps an existing name when promoting" do
      user = create(:user, email: "ops@example.com", name: "Olivia", role: :user)

      described_class.call

      expect(user.reload.name).to eq("Olivia")
    end

    it "ignores blank entries and duplicates" do
      ENV["SUPERADMIN_EMAILS"] = ", ,OPS@example.com,ops@example.com , ,"

      described_class.call

      expect(User.where(email: "ops@example.com").count).to eq(1)
      expect(User.where(email: "").count).to eq(0)
    end

    it "provisions nothing when the variable is unset" do
      ENV.delete("SUPERADMIN_EMAILS")

      expect { described_class.call }.not_to change(User, :count)
    end
  end
end
