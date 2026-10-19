require "rails_helper"

RSpec.describe ApplicationController, type: :controller do
  controller do
    def index
      render json: { tenant: ActsAsTenant.current_tenant.key }
    end
  end

  include_context "without ambient tenant"

  let!(:other) { create(:tenant, key: "other") }

  before do
    allow(Tenants::Registry).to receive(:keys).and_return(%w[cctv other])
  end

  it "serves the default tenant with no subdomain" do
    request.host = "localhost"
    get :index

    expect(response.parsed_body).to eq("tenant" => "cctv")
  end

  it "serves a registered subdomain as that tenant" do
    request.host = "other.localhost"
    get :index

    expect(response.parsed_body).to eq("tenant" => "other")
  end

  it "returns 404 for an unregistered subdomain" do
    request.host = "nope.localhost"
    get :index

    expect(response).to have_http_status(:not_found)
  end
end
