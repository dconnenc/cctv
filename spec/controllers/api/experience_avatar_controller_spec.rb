require "rails_helper"

RSpec.describe Api::ExperienceAvatarController, type: :controller do
  include Passwordless::ControllerHelpers

  let!(:experience) { create(:experience) }
  let!(:participant) do
    create(:experience_participant, experience: experience, role: :audience)
  end
  let(:image) { "data:image/png;base64,AAAA" }
  let(:cosmetics) { [] }

  before do
    jwt = Experiences::AuthService.jwt_for_participant(
      experience: experience,
      user: participant.user
    )
    request.headers["Authorization"] = "Bearer #{jwt}"
  end

  subject do
    post(
      :create,
      params: {
        id: experience.code_slug,
        avatar: { image: image, cosmetics: cosmetics }
      },
      as: :json
    )
  end

  it "flattens the participant avatar to an image" do
    subject

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)["success"]).to be(true)
    avatar = participant.reload.avatar
    expect(avatar["image"]).to eq(image)
    expect(avatar["cosmetics"]).to eq([])
    expect(avatar).not_to have_key("strokes")
  end

  context "with cosmetics" do
    let!(:owned) { create(:cosmetic) }
    let!(:unowned) { create(:cosmetic) }
    let(:cosmetics) do
      [
        { cosmetic_id: owned.id, x: 10, y: 20, width: 100, height: 80, rotation: 0 },
        { cosmetic_id: unowned.id, x: 0, y: 0, width: 10, height: 10, rotation: 0 }
      ]
    end

    before { create(:user_cosmetic, user: participant.user, cosmetic: owned) }

    it "keeps owned cosmetics and drops unowned ones, deriving slug/asset from the record" do
      subject

      placed = participant.reload.avatar["cosmetics"]
      expect(placed.length).to eq(1)
      expect(placed.first).to include(
        "cosmetic_id" => owned.id,
        "slug" => owned.slug,
        "asset_key" => owned.asset_key,
        "x" => 10.0,
        "y" => 20.0
      )
    end
  end

  context "with frame cosmetics" do
    let!(:frame_one) { create(:cosmetic, :frame) }
    let!(:frame_two) { create(:cosmetic, :frame) }
    let(:cosmetics) do
      [
        { cosmetic_id: frame_one.id, x: 50, y: 50, width: 10, height: 10, rotation: 45 },
        { cosmetic_id: frame_two.id, x: 5, y: 5, width: 8, height: 8, rotation: 10 }
      ]
    end

    before do
      create(:user_cosmetic, user: participant.user, cosmetic: frame_one)
      create(:user_cosmetic, user: participant.user, cosmetic: frame_two)
    end

    it "keeps only one frame (last wins) and forces full-canvas geometry" do
      subject

      frames = participant.reload.avatar["cosmetics"].select { |c| c["category"] == "frame" }
      expect(frames.length).to eq(1)
      expect(frames.first).to include(
        "cosmetic_id" => frame_two.id,
        "category" => "frame",
        "x" => 0.0,
        "y" => 0.0,
        "width" => 320.0,
        "height" => 320.0,
        "rotation" => 0.0
      )
    end
  end

  context "when the user has no participant record" do
    before do
      jwt = Experiences::AuthService.jwt_for_admin(user: create(:user, :admin))
      request.headers["Authorization"] = "Bearer #{jwt}"
    end

    it "returns not found" do
      subject
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)["success"]).to be(false)
    end
  end

  context "when the user is a host" do
    let!(:host_participant) do
      create(:experience_participant, experience: experience, role: :host)
    end

    before do
      jwt = Experiences::AuthService.jwt_for_participant(
        experience: experience,
        user: host_participant.user
      )
      request.headers["Authorization"] = "Bearer #{jwt}"
    end

    it "updates the host's own avatar" do
      subject

      expect(response).to have_http_status(:ok)
      expect(host_participant.reload.avatar["image"]).to eq(image)
    end
  end
end
