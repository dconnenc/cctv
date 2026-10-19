require "rails_helper"

RSpec.describe "Active Storage tenancy", type: :request do
  let(:quiz) { Tenant.find_by!(key: "social-quiztancing") }
  let(:blob) do
    ActsAsTenant.with_tenant(quiz) do
      ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "photo.png", content_type: "image/png")
    end
  end
  let(:redirect_path) { "/rails/active_storage/blobs/redirect/#{blob.signed_id}/photo.png" }
  let(:proxy_path) { "/rails/active_storage/blobs/proxy/#{blob.signed_id}/photo.png" }

  it "redirects to the blob on its own tenant's host" do
    host! "social-quiztancing.localhost"
    get redirect_path

    expect(response).to have_http_status(:found)
  end

  it "returns 404 for the blob on another tenant's host" do
    host! "localhost"
    get redirect_path

    expect(response).to have_http_status(:not_found)
  end

  it "proxies the blob only on its own tenant's host" do
    host! "localhost"
    get proxy_path
    expect(response).to have_http_status(:not_found)

    host! "social-quiztancing.localhost"
    get proxy_path
    expect(response).to have_http_status(:ok)
  end

  it "returns 404 on an unknown tenant host" do
    host! "nope.localhost"
    get redirect_path

    expect(response).to have_http_status(:not_found)
  end
end
