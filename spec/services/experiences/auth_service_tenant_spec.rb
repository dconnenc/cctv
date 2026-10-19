require "rails_helper"

RSpec.describe Experiences::AuthService do
  let(:other) { create(:tenant) }
  let(:admin) { create(:user, :admin) }
  let(:user) { create(:user) }
  let(:experience) { create(:experience) }

  before { create(:experience_participant, experience: experience, user: user, role: :audience) }

  it "embeds the tenant in participant tokens" do
    claims = described_class.decode!(described_class.jwt_for_participant(experience: experience, user: user))

    expect(claims[:tenant_id]).to eq(Tenant.default.id)
  end

  it "embeds the tenant in admin tokens" do
    claims = described_class.decode!(described_class.jwt_for_admin(user: admin))

    expect(claims[:tenant_id]).to eq(Tenant.default.id)
  end

  it "accepts tokens on their own tenant" do
    claims = described_class.decode!(described_class.jwt_for_participant(experience: experience, user: user))

    expect(described_class.authorize_participant!(claims)).to eq([user, experience])
  end

  it "rejects a participant token replayed on another tenant" do
    claims = described_class.decode!(described_class.jwt_for_participant(experience: experience, user: user))

    ActsAsTenant.with_tenant(other) do
      expect { described_class.authorize_participant!(claims) }
        .to raise_error(described_class::Unauthorized, /tenant mismatch/)
    end
  end

  it "rejects an admin token replayed on another tenant" do
    claims = described_class.decode!(described_class.jwt_for_admin(user: admin))

    ActsAsTenant.with_tenant(other) do
      expect { described_class.admin_from_claims!(claims) }
        .to raise_error(described_class::Unauthorized, /tenant mismatch/)
    end
  end

  it "rejects a token with no tenant claim" do
    claims = described_class.decode!(described_class.jwt_for_admin(user: admin)).except(:tenant_id)

    expect { described_class.admin_from_claims!(claims) }
      .to raise_error(described_class::Unauthorized, /tenant mismatch/)
  end
end
