require "rails_helper"

RSpec.describe "db/seeds.rb" do
  around do |example|
    original = ENV["SUPERADMIN_EMAILS"]
    ENV["SUPERADMIN_EMAILS"] = "jared.shay@gmail.com"
    example.run
  ensure
    ENV["SUPERADMIN_EMAILS"] = original
  end

  def without_superadmin_emails
    ENV.delete("SUPERADMIN_EMAILS")
    yield
  end

  def run_seeds
    load Rails.root.join("db/seeds.rb")
  end

  it "runs when SUPERADMIN_EMAILS overlaps a previously seeded address" do
    Tenants::Sync.call

    expect { run_seeds }.not_to raise_error

    ActsAsTenant.with_tenant(Tenant.default) do
      expect(Event.find_by(slug: "chicago-comedy-social-technical-expo-2026").creator.email).to eq("jared.shay@gmail.com")
    end
  end

  it "skips the sample event when no superadmin is configured" do
    without_superadmin_emails do
      expect { run_seeds }.not_to raise_error
    end

    ActsAsTenant.with_tenant(Tenant.default) do
      expect(Event.count).to eq(0)
    end
  end

  it "is idempotent" do
    run_seeds

    expect { run_seeds }.not_to change { ActsAsTenant.with_tenant(Tenant.default) { [User.count, Cosmetic.count, Event.count, UserCosmetic.count] } }
  end

  it "creates the starter cosmetics in the default tenant" do
    run_seeds

    ActsAsTenant.with_tenant(Tenant.default) do
      expect(Cosmetic.find_by(slug: "top-hat")).to be_present
    end
  end
end
