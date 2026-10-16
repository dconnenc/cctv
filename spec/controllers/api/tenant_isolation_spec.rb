require "rails_helper"

RSpec.describe Api::ExperiencesController, type: :controller do
  include Passwordless::ControllerHelpers

  let(:other) { create(:tenant) }

  before do
    allow(Tenants::Registry).to receive(:keys).and_return(%w[cctv] + [other.key])
  end

  context "with a signed-in admin on the default host" do
    before { sign_in(create_passwordless_session(create(:user, :admin))) }

    it "lists only the current tenant's experiences" do
      mine = create(:experience)
      theirs = ActsAsTenant.with_tenant(other) { create(:experience) }

      get :index

      expect(response.body).to include(mine.code_slug)
      expect(response.body).not_to include(theirs.code_slug)
    end

    it "lets two tenants use the same experience code" do
      create(:experience, code: "SHARED")

      expect { ActsAsTenant.with_tenant(other) { create(:experience, code: "SHARED") } }.not_to raise_error
    end
  end

  context "when a request arrives on another tenant's host" do
    let!(:experience) { create(:experience, status: :lobby) }

    before { request.host = "#{other.key}.localhost" }

    it "rejects a participant token minted in the experience's tenant" do
      user = create(:user)
      create(:experience_participant, experience: experience, user: user, role: :host)
      request.headers["Authorization"] = "Bearer #{Experiences::AuthService.jwt_for_participant(experience: experience, user: user)}"

      post :start, params: { id: experience.code_slug }

      expect(response).to have_http_status(:unauthorized)
      expect(experience.reload.status).to eq("lobby")
    end

    it "does not let that tenant's admin start the experience" do
      admin = ActsAsTenant.with_tenant(other) { create(:user, :admin) }
      request.headers["Authorization"] = "Bearer #{Experiences::AuthService.jwt_for_admin(user: admin)}"

      post :start, params: { id: experience.code_slug }

      expect(response).to have_http_status(:not_found)
      expect(experience.reload.status).to eq("lobby")
    end

    it "does not resolve the experience code when joining" do
      post :join, params: { code: experience.code_slug }

      expect(response).to have_http_status(:not_found)
    end
  end
end

RSpec.describe Api::EventsController, type: :controller do
  let(:other) { create(:tenant) }

  it "lists only the current tenant's events" do
    mine = create(:event, title: "Mine Show")
    ActsAsTenant.with_tenant(other) { create(:event, title: "Theirs Show") }

    get :index

    expect(response.body).to include(mine.title)
    expect(response.body).not_to include("Theirs Show")
  end
end

RSpec.describe Api::PerformersController, type: :controller do
  let(:other) { create(:tenant) }

  it "lists only the current tenant's performers" do
    Performer.create!(user: create(:user), name: "Mine Performer")
    ActsAsTenant.with_tenant(other) { Performer.create!(user: create(:user), name: "Theirs Performer") }

    get :index

    expect(response.body).to include("Mine Performer")
    expect(response.body).not_to include("Theirs Performer")
  end
end
