require "rails_helper"

RSpec.describe "SPA routing", type: :request do
  include_context "without vite assets"

  let(:cctv_host) { "localhost" }
  let(:quiz) { Tenant.find_by!(key: "social-quiztancing") }
  let(:quiz_host) { "social-quiztancing.localhost" }

  def meta_content(property)
    response.body[/<meta property="#{property}" content="([^"]*)"/, 1]
  end

  context "on a tenant with every feature" do
    before { host! cctv_host }

    %w[/ /about /join /events /events/x /performers /performers/x /experiences/ABC /experiences/ABC/monitor].each do |path|
      it "serves the app shell at #{path}" do
        get path

        expect(response).to have_http_status(:ok)
      end
    end

    it "returns 404 for an unknown path" do
      get "/nope"

      expect(response).to have_http_status(:not_found)
    end

    it "returns 404 for an unknown path under an experience" do
      get "/experiences/ABC/whatever-unknown"

      expect(response).to have_http_status(:not_found)
    end

    it "returns 404 for an HTML request to an unknown API path" do
      get "/api/nope", headers: { "Accept" => "text/html" }

      expect(response).to have_http_status(:not_found)
    end

    {
      "/about" => { "Accept" => "application/json" },
      "/about.json" => {},
      "/events/x.json" => {},
      "/experiences/ABC" => { "Accept" => "application/json" },
      "/" => { "Accept" => "application/json" },
    }.each do |path, headers|
      it "returns 404 for a non-HTML request to #{path}" do
        get path, headers: headers

        expect(response).to have_http_status(:not_found)
      end
    end

    it "keeps serving the health check" do
      get "/up"

      expect(response).to have_http_status(:ok)
    end
  end

  context "on a tenant without events and performers" do
    before { host! quiz_host }

    %w[/ /about /join].each do |path|
      it "serves the app shell at #{path}" do
        get path

        expect(response).to have_http_status(:ok)
      end
    end

    %w[/events /events/x /events/new /performers /performers/x /performers/x/edit /nope /experiences/ABC/whatever-unknown].each do |path|
      it "returns 404 with generic metadata at #{path}" do
        get path

        expect(response).to have_http_status(:not_found)
        expect(meta_content("og:title")).to eq("Social Quiztancing")
        expect(meta_content("og:description")).to eq(quiz.config.theme.description)
      end
    end

    it "returns 404 for an HTML request to a gated-off API path" do
      get "/api/events", headers: { "Accept" => "text/html" }

      expect(response).to have_http_status(:not_found)
    end
  end
end
