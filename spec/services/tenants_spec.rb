require "rails_helper"

RSpec.describe Tenants do
  it "runs a block as the tenant with the given key" do
    quiz = Tenant.find_by!(key: "social-quiztancing")

    expect(described_class.with("social-quiztancing") { ActsAsTenant.current_tenant }).to eq(quiz)
  end

  it "accepts a Tenant" do
    expect(described_class.with(Tenant.default) { ActsAsTenant.current_tenant }).to eq(Tenant.default)
  end

  it "raises for an unknown key" do
    expect { described_class.with("nope") { 1 } }.to raise_error(ActiveRecord::RecordNotFound)
  end

  it "yields every registered tenant, each inside its own tenant context" do
    seen = []
    described_class.each { |tenant| seen << [tenant.key, ActsAsTenant.current_tenant.key] }

    expect(seen).to match_array(Tenants::Registry.keys.map { |key| [key, key] })
  end
end
