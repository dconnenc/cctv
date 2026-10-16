require "rails_helper"

RSpec.describe ExperienceSubscriptionChannel, type: :channel do
  let(:other) { create(:tenant) }
  let(:admin) { create(:user, :admin) }
  let(:token) { Experiences::AuthService.jwt_for_admin(user: admin) }

  it "confirms a subscription to an experience in the same tenant" do
    experience = create(:experience)

    subscribe(code: experience.code_slug, token: token)

    expect(subscription).to be_confirmed
  end

  it "rejects a subscription to another tenant's experience" do
    foreign = ActsAsTenant.with_tenant(other) { create(:experience) }

    subscribe(code: foreign.code_slug, token: token)

    expect(subscription).to be_rejected
  end

  it "rejects a monitor subscription to another tenant's experience" do
    foreign = ActsAsTenant.with_tenant(other) { create(:experience) }

    subscribe(code: foreign.code_slug, view_type: "monitor")

    expect(subscription).to be_rejected
  end
end
