require "rails_helper"

RSpec.describe Api::ExperienceSegmentsController, type: :controller do
  include Passwordless::ControllerHelpers

  let!(:experience) { create(:experience) }
  let(:admin) { create(:user, :admin) }

  before do
    sign_in(create_passwordless_session(admin))
  end

  describe "POST #create" do
    subject do
      post(
        :create,
        params: { experience_id: experience.code_slug, name: "Team A", color: "#FF0000" },
        format: :json
      )
    end

    it "creates a segment" do
      expect { subject }.to change { experience.experience_segments.count }.by(1)

      segment = experience.experience_segments.first
      expect(segment.name).to eq("Team A")
      expect(segment.color).to eq("#FF0000")

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["success"]).to be(true)
      expect(json["data"]["name"]).to eq("Team A")
    end

    context "when the user is an audience participant" do
      let(:participant) { create(:experience_participant, experience: experience, role: :audience) }

      before do
        jwt = Experiences::AuthService.jwt_for_participant(experience: experience, user: participant.user)
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "returns forbidden" do
        subject
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH #update" do
    let!(:segment) do
      experience.experience_segments.create!(name: "Team A", color: "#FF0000", position: 0)
    end

    subject do
      patch(
        :update,
        params: { experience_id: experience.code_slug, id: segment.id, name: "Team B" },
        format: :json
      )
    end

    it "updates the segment" do
      subject

      expect(segment.reload.name).to eq("Team B")
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["success"]).to be(true)
      expect(json["data"]["name"]).to eq("Team B")
    end
  end

  describe "DELETE #destroy" do
    let!(:segment) do
      experience.experience_segments.create!(name: "Team A", color: "#FF0000", position: 0)
    end

    subject do
      delete(
        :destroy,
        params: { experience_id: experience.code_slug, id: segment.id },
        format: :json
      )
    end

    it "destroys the segment" do
      expect { subject }.to change { experience.experience_segments.count }.by(-1)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["success"]).to be(true)
    end
  end

  describe "POST #assign" do
    let!(:segment) do
      experience.experience_segments.create!(name: "Team A", color: "#FF0000", position: 0)
    end

    let!(:participant) { create(:experience_participant, experience: experience) }

    subject do
      post(
        :assign,
        params: {
          experience_id: experience.code_slug,
          id: segment.id,
          participant_ids: [participant.id]
        },
        format: :json
      )
    end

    it "assigns participants to the segment" do
      expect { subject }.to change { segment.experience_participant_segments.count }.by(1)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["success"]).to be(true)
    end

    context "when removing participants" do
      before do
        ExperienceParticipantSegment.create!(
          experience_participant: participant,
          experience_segment: segment
        )
      end

      subject do
        post(
          :assign,
          params: {
            experience_id: experience.code_slug,
            id: segment.id,
            assign_action: "remove",
            participant_ids: [participant.id]
          },
          format: :json
        )
      end

      it "removes participants from the segment" do
        expect { subject }.to change { segment.experience_participant_segments.count }.by(-1)
      end
    end
  end
end
