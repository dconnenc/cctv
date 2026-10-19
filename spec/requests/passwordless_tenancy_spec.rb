require "rails_helper"

RSpec.describe "Sign-in links across tenants", type: :request do
  let(:user) { create(:user) }
  let(:session) { Passwordless::Session.create!(authenticatable: user) }
  let(:link) { "/users/sign_in/#{session.identifier}/#{session.token}" }

  it "signs the user in on the tenant that owns them" do
    host! "localhost"
    get link

    expect(response).to have_http_status(:see_other)
    get "/api/users/me"
    expect(response.parsed_body["id"]).to eq(user.id)
  end

  it "does not sign the user in when the link is opened on another tenant's host" do
    host! "social-quiztancing.localhost"
    get link

    expect(response).to have_http_status(:see_other)
    get "/api/users/me"
    expect(response.parsed_body).to eq({})
  end

  it "does not error when the sign-in page is opened on another tenant's host" do
    host! "social-quiztancing.localhost"
    get "/users/sign_in/#{session.identifier}"

    expect(response).to have_http_status(:ok)
  end
end
