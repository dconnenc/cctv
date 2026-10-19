require "rails_helper"

RSpec.describe Api::BaseController, type: :controller do
  include Passwordless::ControllerHelpers
  include_context "without ambient tenant"

  controller(described_class) do
    before_action :authenticate_and_set_user_and_experience, only: [:guarded]

    def guarded
      authorize! @experience, to: :manage?
      render json: { success: true }
    end

    def lookup
      Experience.find(params[:id])
      render json: { success: true }
    end

    def named_missing
      raise Api::BaseController::NotFoundError, "invalid thing"
    end

    def required_param
      params.require(:thing)
      render json: { success: true }
    end
  end

  let!(:experience) { Tenants.with("cctv") { create(:experience) } }

  before do
    routes.draw do
      get "guarded/:experience_id" => "api/base#guarded"
      get "lookup/:id" => "api/base#lookup"
      get "required_param" => "api/base#required_param"
      get "named_missing" => "api/base#named_missing"
    end
    allow(Analytics::Tracker).to receive(:capture_exception)
  end

  def bearer(token)
    request.headers["Authorization"] = "Bearer #{token}"
  end

  def participant_token(role: :host, target: experience, ttl: 7.days)
    Tenants.with(target.tenant) do
      user = create(:user)
      create(:experience_participant, experience: target, user: user, role: role)
      Experiences::AuthService.jwt_for_participant(experience: target, user: user, ttl: ttl)
    end
  end

  def unscoped_token
    now = Time.current.to_i
    JWT.encode(
      {
        sub: Tenants.with("cctv") { create(:user).id },
        scope: "other",
        tenant_id: Tenant.default.id,
        iat: now,
        nbf: now,
        exp: now + 3600,
        iss: Experiences::AuthService::ISSUER,
        aud: Experiences::AuthService::AUDIENCE,
      },
      Experiences::AuthService::JWT_SECRET,
      Experiences::AuthService::ALGORITHM,
    )
  end

  shared_examples "an unreported error response" do |status, error|
    it "renders #{status} JSON without reporting the error" do
      subject

      expect(response).to have_http_status(status)
      expect(response.parsed_body).to eq("success" => false, "error" => error)
      expect(Analytics::Tracker).not_to have_received(:capture_exception)
    end
  end

  describe "authentication failures" do
    subject { get :guarded, params: { experience_id: experience.code_slug } }

    context "without credentials" do
      it_behaves_like "an unreported error response", :unauthorized, "unauthorized"
    end

    context "with a malformed token" do
      before { bearer("not-a-jwt") }

      it_behaves_like "an unreported error response", :unauthorized, "unauthorized"
    end

    context "with an expired token" do
      before { bearer(participant_token(ttl: -1.hour)) }

      it_behaves_like "an unreported error response", :unauthorized, "unauthorized"
    end

    context "with a token of unknown scope" do
      before { bearer(unscoped_token) }

      it_behaves_like "an unreported error response", :unauthorized, "unauthorized"
    end

    context "with a token minted in another tenant" do
      before do
        other_tenant = create(:tenant)
        token = participant_token(target: Tenants.with(other_tenant) { create(:experience) })
        bearer(token)
      end

      it_behaves_like "an unreported error response", :unauthorized, "unauthorized"
    end

    context "with a participant token for a different experience" do
      before { bearer(participant_token(target: Tenants.with("cctv") { create(:experience) })) }

      it_behaves_like "an unreported error response", :unauthorized, "unauthorized"
    end

    context "with a participant token whose user no longer exists" do
      before do
        token = participant_token
        Tenants.with("cctv") { experience.experience_participants.each { |p| p.user.destroy! } }
        bearer(token)
      end

      it_behaves_like "an unreported error response", :unauthorized, "unauthorized"
    end

    context "with an admin token whose user is no longer an admin" do
      before do
        token = Tenants.with("cctv") do
          user = create(:user, :admin)
          Experiences::AuthService.jwt_for_admin(user: user).tap { user.update!(role: :user) }
        end
        bearer(token)
      end

      it_behaves_like "an unreported error response", :unauthorized, "unauthorized"
    end
  end

  describe "lookup failures" do
    context "with an admin token for an unknown experience" do
      subject { get :guarded, params: { experience_id: "missing" } }

      before { bearer(Tenants.with("cctv") { Experiences::AuthService.jwt_for_admin(user: create(:user, :admin)) }) }

      it_behaves_like "an unreported error response", :not_found, "not found"
    end

    context "with a session admin for an unknown experience" do
      subject { get :guarded, params: { experience_id: "missing" } }

      before { sign_in(Tenants.with("cctv") { create_passwordless_session(create(:user, :admin)) }) }

      it_behaves_like "an unreported error response", :not_found, "not found"
    end

    context "when a record lookup fails inside an action" do
      subject { get :lookup, params: { id: 0 } }

      it_behaves_like "an unreported error response", :not_found, "not found"
    end
  end

  describe "a not found error raised with a message" do
    subject { get :named_missing }

    it_behaves_like "an unreported error response", :not_found, "invalid thing"
  end

  describe "a missing required parameter" do
    subject { get :required_param }

    it_behaves_like "an unreported error response", :bad_request, "bad request"
  end

  describe "a policy denial" do
    subject { get :guarded, params: { experience_id: experience.code_slug } }

    before { bearer(participant_token(role: :audience)) }

    it_behaves_like "an unreported error response", :forbidden, "forbidden"
  end

  describe "a successful request" do
    it "renders the action" do
      bearer(participant_token)

      get :guarded, params: { experience_id: experience.code_slug }

      expect(response).to have_http_status(:ok)
    end
  end
end
