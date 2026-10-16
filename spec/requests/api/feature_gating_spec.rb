require "rails_helper"

RSpec.describe "feature gating", type: :request do
  def self.gated_requests
    [
      [:get, "/api/discover"],
      [:get, "/api/events"],
      [:get, "/api/events/any-slug"],
      [:get, "/api/events/any-slug/ical"],
      [:post, "/api/events"],
      [:patch, "/api/events/any-slug"],
      [:delete, "/api/events/any-slug"],
      [:get, "/api/performers"],
      [:get, "/api/performers/any-slug"],
      [:post, "/api/performers"],
      [:patch, "/api/performers/any-slug"],
      [:delete, "/api/performers/any-slug"],
      [:post, "/api/performers/any-slug/follow"],
      [:delete, "/api/performers/any-slug/follow"],
      [:get, "/api/users/following"],
    ]
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

  it "serves ungated routes on a tenant without the features" do
    host! "social-quiztancing.localhost"
    get "/api/users/me", headers: { "Accept" => "*/*" }

    expect(response).to have_http_status(:ok)
  end
end
