require "rails_helper"

RSpec.shared_examples "a tenant-bound direct upload endpoint" do
  let!(:other) { create(:tenant, key: "other") }
  let(:experience) { create(:experience) }
  let(:user) { create(:user) }
  let(:blob_params) do
    {
      blob: {
        filename: "photo.png",
        byte_size: 1024,
        checksum: Digest::MD5.base64digest("photo"),
        content_type: "image/png",
      },
    }
  end

  before do
    allow(Tenants::Registry).to receive(:keys).and_return(%w[cctv other])
    create(:experience_participant, experience: experience, user: user, role: :audience)
    jwt = Experiences::AuthService.jwt_for_participant(experience: experience, user: user)
    request.headers["Authorization"] = "Bearer #{jwt}"
  end

  it "accepts a token on the tenant that minted it" do
    request.host = "localhost"

    expect { post :create, params: blob_params, format: :json }.to change(ActiveStorage::Blob, :count).by(1)
    expect(response).to have_http_status(:ok)
  end

  it "rejects a token minted in another tenant" do
    request.host = "other.localhost"

    expect { post :create, params: blob_params, format: :json }.not_to change(ActiveStorage::Blob, :count)
    expect(response).to have_http_status(:unauthorized)
  end
end

RSpec.describe Api::DirectUploadsController, type: :controller do
  it_behaves_like "a tenant-bound direct upload endpoint"
end

RSpec.describe Api::FeedbackDirectUploadsController, type: :controller do
  it_behaves_like "a tenant-bound direct upload endpoint"
end
