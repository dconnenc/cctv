require "rails_helper"

RSpec.describe Api::ExperiencesController, type: :controller do
  include Passwordless::ControllerHelpers
  include_context "without ambient tenant"

  let(:other) { create(:tenant) }

  before do
    allow(Tenants::Registry).to receive(:keys).and_return(%w[cctv] + [other.key])
  end

  context "with a signed-in admin on the default host" do
    before { sign_in(Tenants.with("cctv") { create_passwordless_session(create(:user, :admin)) }) }

    it "lists only the current tenant's experiences" do
      mine = Tenants.with("cctv") { create(:experience) }
      theirs = Tenants.with(other) { create(:experience) }

      get :index

      expect(response.body).to include(mine.code_slug)
      expect(response.body).not_to include(theirs.code_slug)
    end

    it "lets two tenants use the same experience code" do
      Tenants.with("cctv") { create(:experience, code: "SHARED") }

      expect { Tenants.with(other) { create(:experience, code: "SHARED") } }.not_to raise_error
    end
  end

  context "when a request arrives on another tenant's host" do
    let!(:experience) { Tenants.with("cctv") { create(:experience, status: :lobby) } }

    before { request.host = "#{other.key}.localhost" }

    def status_of(experience)
      Tenants.with("cctv") { experience.reload.status }
    end

    it "rejects a participant token minted in the experience's tenant" do
      token = Tenants.with("cctv") do
        user = create(:user)
        create(:experience_participant, experience: experience, user: user, role: :host)
        Experiences::AuthService.jwt_for_participant(experience: experience, user: user)
      end
      request.headers["Authorization"] = "Bearer #{token}"

      post :start, params: { id: experience.code_slug }

      expect(response).to have_http_status(:unauthorized)
      expect(status_of(experience)).to eq("lobby")
    end

    it "does not let that tenant's admin start the experience" do
      token = Tenants.with(other) { Experiences::AuthService.jwt_for_admin(user: create(:user, :admin)) }
      request.headers["Authorization"] = "Bearer #{token}"

      post :start, params: { id: experience.code_slug }

      expect(response).to have_http_status(:not_found)
      expect(status_of(experience)).to eq("lobby")
    end

    it "does not resolve the experience code when joining" do
      post :join, params: { code: experience.code_slug }

      expect(response).to have_http_status(:not_found)
    end
  end
end

RSpec.describe Api::EventsController, type: :controller do
  include_context "without ambient tenant"

  let(:other) { create(:tenant) }

  it "lists only the current tenant's events" do
    mine = Tenants.with("cctv") { create(:event, title: "Mine Show") }
    Tenants.with(other) { create(:event, title: "Theirs Show") }

    get :index

    expect(response.body).to include(mine.title)
    expect(response.body).not_to include("Theirs Show")
  end
end

RSpec.describe Api::PerformersController, type: :controller do
  include_context "without ambient tenant"

  let(:other) { create(:tenant) }

  it "lists only the current tenant's performers" do
    Tenants.with("cctv") { Performer.create!(user: create(:user), name: "Mine Performer") }
    Tenants.with(other) { Performer.create!(user: create(:user), name: "Theirs Performer") }

    get :index

    expect(response.body).to include("Mine Performer")
    expect(response.body).not_to include("Theirs Performer")
  end
end
