require "rails_helper"

RSpec.describe "db/seeds.rb" do
  around do |example|
    original = ENV["SUPERADMIN_EMAILS"]
    ENV["SUPERADMIN_EMAILS"] = "jared.shay@gmail.com"
    example.run
  ensure
    ENV["SUPERADMIN_EMAILS"] = original
  end

  def run_seeds
    load Rails.root.join("db/seeds.rb")
  end

  it "runs when SUPERADMIN_EMAILS overlaps a previously seeded address" do
    Tenants::Sync.call

    expect { run_seeds }.not_to raise_error
  end

  it "is idempotent" do
    run_seeds

    expect { run_seeds }.not_to change { ActsAsTenant.with_tenant(Tenant.default) { [User.count, Cosmetic.count] } }
  end

  it "creates the starter cosmetics in the default tenant" do
    run_seeds

    ActsAsTenant.with_tenant(Tenant.default) do
      expect(Cosmetic.find_by(slug: "top-hat")).to be_present
    end
  end
end
