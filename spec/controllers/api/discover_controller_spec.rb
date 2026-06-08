require "rails_helper"

RSpec.describe Api::DiscoverController, type: :controller do
  describe "GET #index" do
    it "returns theaters and ranked events without authentication" do
      create(:event, title: "Upcoming", venue_name: "The Second City",
                     starts_at: 1.day.from_now, ends_at: 1.day.from_now + 2.hours)

      get :index

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)
      expect(body["success"]).to be(true)
      expect(body["theaters"]).to be_an(Array)
      expect(body["theaters"].size).to eq(ChicagoTheater.all.size)
      expect(body["events"].first["theater_slug"]).to eq("second-city")
      expect(body["events"].first["is_live"]).to be(false)
    end
  end
end
