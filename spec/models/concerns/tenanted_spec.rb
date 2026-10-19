require "rails_helper"

RSpec.describe Tenanted do
  let(:other) { create(:tenant) }

  it "stamps the current tenant on create" do
    expect(create(:user).tenant).to eq(Tenant.default)
  end

  it "stamps the current tenant when saved without validation" do
    experience = create(:experience)
    block = build(:experience_block, experience: experience)
    block.save!(validate: false)

    expect(block.reload.tenant).to eq(Tenant.default)
  end

  it "scopes queries to the current tenant" do
    mine = create(:user)
    theirs = ActsAsTenant.with_tenant(other) { create(:user) }

    expect(User.all).to include(mine)
    expect(User.all).not_to include(theirs)
    expect(ActsAsTenant.with_tenant(other) { User.all }).to contain_exactly(theirs)
  end

  it "makes tenant_id immutable" do
    user = create(:user)

    expect { user.update!(tenant: other) }.to raise_error(ActsAsTenant::Errors::TenantIsImmutable)
  end

  it "raises when a tenanted model is queried without a tenant" do
    previous = ActsAsTenant.test_tenant
    ActsAsTenant.test_tenant = nil
    ActsAsTenant.current_tenant = nil

    expect { User.count }.to raise_error(ActsAsTenant::Errors::NoTenantSet)
  ensure
    ActsAsTenant.test_tenant = previous
  end

  it "stamps tenant_id on insert_all, which skips callbacks" do
    user = create(:user)
    cosmetic = create(:cosmetic)

    UserCosmetic.insert_all([{ user_id: user.id, cosmetic_id: cosmetic.id, source: "grant", acquired_at: Time.current }])

    expect(UserCosmetic.find_by!(user_id: user.id, cosmetic_id: cosmetic.id).tenant).to eq(Tenant.default)
  end

  it "raises on insert_all with no tenant instead of writing NULL" do
    previous = ActsAsTenant.test_tenant
    user = create(:user)
    cosmetic = create(:cosmetic)
    ActsAsTenant.test_tenant = nil
    ActsAsTenant.current_tenant = nil

    expect {
      UserCosmetic.insert_all([{ user_id: user.id, cosmetic_id: cosmetic.id, source: "grant", acquired_at: Time.current }])
    }.to raise_error(ActsAsTenant::Errors::NoTenantSet)
  ensure
    ActsAsTenant.test_tenant = previous
  end

  it "raises on insert_all! with no tenant instead of writing NULL" do
    previous = ActsAsTenant.test_tenant
    user = create(:user)
    cosmetic = create(:cosmetic)
    ActsAsTenant.test_tenant = nil
    ActsAsTenant.current_tenant = nil

    expect {
      UserCosmetic.insert_all!([{ user_id: user.id, cosmetic_id: cosmetic.id, source: "grant", acquired_at: Time.current }])
    }.to raise_error(ActsAsTenant::Errors::NoTenantSet)
  ensure
    ActsAsTenant.test_tenant = previous
  end

  it "raises on upsert_all with no tenant instead of writing NULL" do
    previous = ActsAsTenant.test_tenant
    user = create(:user)
    cosmetic = create(:cosmetic)
    ActsAsTenant.test_tenant = nil
    ActsAsTenant.current_tenant = nil

    expect {
      UserCosmetic.upsert_all([{ user_id: user.id, cosmetic_id: cosmetic.id, source: "grant", acquired_at: Time.current }])
    }.to raise_error(ActsAsTenant::Errors::NoTenantSet)
  ensure
    ActsAsTenant.test_tenant = previous
  end

  it "validates uniqueness per tenant, not globally" do
    create(:user, email: "same@example.com")

    expect(build(:user, email: "same@example.com")).not_to be_valid
    expect(ActsAsTenant.with_tenant(other) { build(:user, email: "same@example.com").valid? }).to be(true)
  end

  it "allows the same experience code in two tenants" do
    create(:experience, code: "SHARED")

    expect(build(:experience, code: "SHARED")).not_to be_valid
    expect(ActsAsTenant.with_tenant(other) { build(:experience, code: "SHARED").valid? }).to be(true)
  end
end
