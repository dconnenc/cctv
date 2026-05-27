require "rails_helper"

RSpec.describe Api::ExperienceAvatarController, type: :controller do
  include Passwordless::ControllerHelpers

  let!(:experience) { create(:experience) }
  let!(:participant) do
    create(:experience_participant, experience: experience, role: :audience)
  end
  let(:strokes) { [{ "points" => [1, 2, 3, 4], "color" => "#ff0000", "width" => 4 }] }

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
        avatar: { strokes: strokes }
      },
      format: :json
    )
  end

  it "updates the participant avatar" do
    subject

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)["success"]).to be(true)
    expect(participant.reload.avatar["strokes"]).to eq(strokes)
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
      expect(host_participant.reload.avatar["strokes"]).to eq(strokes)
    end
  end
end
