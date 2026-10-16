require "rails_helper"

RSpec.describe Api::EventsController, type: :controller do
  it "serves events on cctv" do
    get :index

    expect(response).to have_http_status(:ok)
  end

  it "404s events on a tenant without the events feature" do
    request.host = "social-quiztancing.localhost"
    get :index

    expect(response).to have_http_status(:not_found)
  end
end

RSpec.describe Api::PerformersController, type: :controller do
  it "404s performers on a tenant without the performers feature" do
    request.host = "social-quiztancing.localhost"
    get :index

    expect(response).to have_http_status(:not_found)
  end
end

RSpec.describe Api::DiscoverController, type: :controller do
  it "404s discover on a tenant without the discover feature" do
    request.host = "social-quiztancing.localhost"
    get :index

    expect(response).to have_http_status(:not_found)
  end
end
