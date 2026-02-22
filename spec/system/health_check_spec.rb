require "rails_helper"

RSpec.describe "Health check", type: :system do
  it "returns a success response" do
    visit "/up"

    expect(page).to have_http_status(200)
  end
end
