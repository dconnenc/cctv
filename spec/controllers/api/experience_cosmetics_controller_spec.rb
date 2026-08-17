require "rails_helper"

RSpec.describe Api::ExperienceCosmeticsController, type: :controller do
  include Passwordless::ControllerHelpers

  let!(:experience) { create(:experience) }
  let!(:participant) do
    create(:experience_participant, experience: experience, role: :audience)
  end
  let!(:owned) { create(:cosmetic, name: "Owned Hat") }
  let!(:owned_inactive) { create(:cosmetic, active: false) }
  let!(:unowned) { create(:cosmetic, name: "Unowned Hat") }

  before do
    create(:user_cosmetic, user: participant.user, cosmetic: owned)
    create(:user_cosmetic, user: participant.user, cosmetic: owned_inactive)

    jwt = Experiences::AuthService.jwt_for_participant(
      experience: experience,
      user: participant.user
    )
    request.headers["Authorization"] = "Bearer #{jwt}"
  end

  subject { get(:index, params: { id: experience.code_slug }, as: :json) }

  it "returns only the current user's owned, active cosmetics" do
    subject

    expect(response).to have_http_status(:ok)
    cosmetics = JSON.parse(response.body)["cosmetics"]
    ids = cosmetics.map { |c| c["id"] }

    expect(ids).to eq([owned.id])
    expect(ids).not_to include(unowned.id)
    expect(ids).not_to include(owned_inactive.id)
    expect(cosmetics.first).to include(
      "slug" => owned.slug,
      "category" => owned.category,
      "asset_key" => owned.asset_key,
      "default_placement" => owned.default_placement
    )
  end

  context "when the user has no participant record" do
    before do
      jwt = Experiences::AuthService.jwt_for_admin(user: create(:user, :admin))
      request.headers["Authorization"] = "Bearer #{jwt}"
    end

    it "returns not found" do
      subject
      expect(response).to have_http_status(:not_found)
    end
  end
end
