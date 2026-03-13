require "rails_helper"

RSpec.describe Api::ExperienceParticipantsController, type: :controller do
  include Passwordless::ControllerHelpers

  let!(:experience) { create(:experience) }
  let(:admin) { create(:user, :admin) }

  before do
    sign_in(create_passwordless_session(admin))
  end

  describe "DELETE #kick" do
    let!(:participant) { create(:experience_participant, experience: experience, role: :audience) }

    subject do
      delete(
        :kick,
        params: { experience_id: experience.code_slug, id: participant.id },
        format: :json
      )
    end

    it "removes the participant" do
      expect { subject }.to change { experience.experience_participants.count }.by(-1)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["success"]).to be(true)
    end

    context "when the participant does not exist" do
      subject do
        delete(
          :kick,
          params: { experience_id: experience.code_slug, id: 0 },
          format: :json
        )
      end

      it "returns not found" do
        subject
        expect(response).to have_http_status(:not_found)
        json = JSON.parse(response.body)
        expect(json["success"]).to be(false)
      end
    end

    context "when the user is an audience participant" do
      let(:audience_participant) { create(:experience_participant, experience: experience, role: :audience) }

      before do
        jwt = Experiences::AuthService.jwt_for_participant(experience: experience, user: audience_participant.user)
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "returns forbidden" do
        subject
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when the user is a host" do
      let(:host_participant) { create(:experience_participant, experience: experience, role: :host) }

      before do
        jwt = Experiences::AuthService.jwt_for_participant(experience: experience, user: host_participant.user)
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "removes the participant" do
        expect { subject }.to change { experience.experience_participants.count }.by(-1)
        expect(response).to have_http_status(:ok)
      end
    end

    context "when the user is a moderator" do
      let(:moderator_participant) { create(:experience_participant, experience: experience, role: :moderator) }

      before do
        jwt = Experiences::AuthService.jwt_for_participant(experience: experience, user: moderator_participant.user)
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "removes the participant" do
        expect { subject }.to change { experience.experience_participants.count }.by(-1)
        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe "POST #avatar" do
    let!(:participant) { create(:experience_participant, experience: experience, role: :audience) }
    let(:strokes) { [{ "points" => ["1", "2", "3", "4"], "color" => "#ff0000", "width" => "4" }] }

    subject do
      post(
        :avatar,
        params: {
          experience_id: experience.code_slug,
          id: participant.id,
          avatar: { strokes: strokes }
        },
        format: :json
      )
    end

    it "updates the participant avatar" do
      subject

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["success"]).to be(true)
      expect(participant.reload.avatar["strokes"]).to eq(strokes)
    end

    context "when the participant updates their own avatar" do
      before do
        jwt = Experiences::AuthService.jwt_for_participant(experience: experience, user: participant.user)
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "allows the update" do
        subject
        expect(response).to have_http_status(:ok)
        expect(participant.reload.avatar["strokes"]).to eq(strokes)
      end
    end

    context "when a different audience participant tries to update the avatar" do
      let(:other_participant) { create(:experience_participant, experience: experience, role: :audience) }

      before do
        jwt = Experiences::AuthService.jwt_for_participant(experience: experience, user: other_participant.user)
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "returns forbidden" do
        subject
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when the user is a host" do
      let(:host_participant) { create(:experience_participant, experience: experience, role: :host) }

      before do
        jwt = Experiences::AuthService.jwt_for_participant(experience: experience, user: host_participant.user)
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "allows the update" do
        subject
        expect(response).to have_http_status(:ok)
        expect(participant.reload.avatar["strokes"]).to eq(strokes)
      end
    end

    context "when the participant does not exist" do
      subject do
        post(
          :avatar,
          params: {
            experience_id: experience.code_slug,
            id: 0,
            avatar: { strokes: strokes }
          },
          format: :json
        )
      end

      it "returns not found" do
        subject
        expect(response).to have_http_status(:not_found)
        json = JSON.parse(response.body)
        expect(json["success"]).to be(false)
      end
    end
  end
end
