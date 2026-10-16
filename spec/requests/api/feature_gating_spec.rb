require "rails_helper"

RSpec.describe "feature gating", type: :request do
  def self.gated_requests
    RouteClassification.gated_routes.flat_map do |route|
      path = RouteClassification.path(route).gsub(/:\w+/, "any-slug")
      route.verb.split("|").map { |verb| [verb.downcase.to_sym, path] }
    end.uniq
  end

  it "derives gated requests from the route table" do
    expect(self.class.gated_requests).to include(
      [:get, "/api/users/following"],
      [:put, "/api/events/any-slug"],
      [:put, "/api/performers/any-slug"],
    )
  end

  gated_requests.each do |verb, path|
    it "returns 404 for #{verb.upcase} #{path} on a tenant without the feature" do
      host! "social-quiztancing.localhost"
      public_send(verb, path, headers: { "Accept" => "*/*" })

      expect(response).to have_http_status(:not_found)
    end
  end

  it "returns 404 for a JSON request to a gated route" do
    host! "social-quiztancing.localhost"
    get "/api/events", as: :json

    expect(response).to have_http_status(:not_found)
  end

  it "still serves gated routes on the default tenant" do
    host! "localhost"
    get "/api/discover", headers: { "Accept" => "*/*" }

    expect(response).to have_http_status(:ok)
  end

  it "routes GET /api/users/following to the users controller on the default tenant" do
    host! "localhost"
    get "/api/users/following", as: :json

    expect(response).to have_http_status(:unauthorized)
    expect(response.parsed_body).to eq(
      "type" => "error",
      "success" => false,
      "message" => "Not authenticated",
    )
  end

  it "serves ungated routes on a tenant without the features" do
    host! "social-quiztancing.localhost"
    get "/api/users/me", headers: { "Accept" => "*/*" }

    expect(response).to have_http_status(:ok)
  end
end
