require "rails_helper"

RSpec.describe "client routes" do
  let(:app_tsx) { Rails.root.join("app/frontend/App.tsx").read }
  let(:declared_paths) { app_tsx.scan(/\bpath=["']([^"']+)["']/).flatten }

  def client_paths
    absolute = declared_paths.select { |path| path.start_with?("/") }
    relative = declared_paths.reject { |path| path.start_with?("/") || path == "*" }
    absolute + relative.map { |path| "/experiences/:code/#{path}" }
  end

  def concrete(path)
    path.gsub(/:[a-zA-Z]+/, "x")
  end

  it "nests the relative client routes under /experiences/:code" do
    expect(app_tsx).to match(%r{<Route\s+path="/experiences/:code"\s+element=})
  end

  it "routes every path declared in App.tsx to the SPA on a tenant with all features" do
    expect(client_paths).not_to be_empty

    client_paths.each do |path|
      recognized = Rails.application.routes.recognize_path(concrete(path), method: :get)

      expect(recognized).to include(controller: "spa", action: "index"), "#{path} is not routed to spa#index"
    end
  end

  it "sends undeclared HTML paths to the SPA not-found action" do
    recognized = Rails.application.routes.recognize_path("/nope", method: :get)

    expect(recognized).to include(controller: "spa", action: "not_found")
  end

  it "does not send /api paths to the SPA" do
    expect { Rails.application.routes.recognize_path("/api/nope", method: :get) }
      .to raise_error(ActionController::RoutingError)
  end
end
