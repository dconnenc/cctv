require "rails_helper"

RSpec.describe Api::ExperienceParticipantsController, type: :controller do
  include Passwordless::ControllerHelpers

  let!(:experience) { create(:experience) }
  let(:admin) { create(:user, :admin) }

  before do
    sign_in(create_passwordless_session(admin))
  end

  describe "DELETE #kick" do
    let!(:participant) do
      create(:experience_participant, experience: experience, role: :audience)
    end

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
      expect(JSON.parse(response.body)["success"]).to be(true)
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
        expect(JSON.parse(response.body)["success"]).to be(false)
      end
    end

    context "when the user is an audience participant" do
      let!(:audience_participant) do
        create(:experience_participant, experience: experience, role: :audience)
      end

      before do
        jwt = Experiences::AuthService.jwt_for_participant(
          experience: experience,
          user: audience_participant.user
        )
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "returns forbidden" do
        subject
        expect(response).to have_http_status(:forbidden)
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

      it "removes the participant" do
        expect { subject }.to change { experience.experience_participants.count }.by(-1)
        expect(response).to have_http_status(:ok)
      end
    end

    context "when the user is a moderator" do
      let!(:moderator_participant) do
        create(:experience_participant, experience: experience, role: :moderator)
      end

      before do
        jwt = Experiences::AuthService.jwt_for_participant(
          experience: experience,
          user: moderator_participant.user
        )
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "removes the participant" do
        expect { subject }.to change { experience.experience_participants.count }.by(-1)
        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe "GET #submissions" do
    let!(:participant) do
      create(:experience_participant, experience: experience, role: :audience)
    end
    let!(:block) { create(:experience_block, experience: experience) }

    subject do
      get(
        :submissions,
        params: { experience_id: experience.code_slug, id: participant.id },
        format: :json
      )
    end

    it "returns submissions for the participant" do
      create(:experience_poll_submission, experience_block: block, experience_participant: participant)

      subject

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["success"]).to be(true)
      expect(json["data"]["submissions"].length).to eq(1)
    end

    it "does not return submissions belonging to other participants" do
      other_participant = create(:experience_participant, experience: experience, role: :audience)
      create(:experience_poll_submission, experience_block: block, experience_participant: other_participant)

      subject

      expect(JSON.parse(response.body)["data"]["submissions"]).to be_empty
    end

    context "when the participant does not exist" do
      subject do
        get(
          :submissions,
          params: { experience_id: experience.code_slug, id: 0 },
          format: :json
        )
      end

      it "returns not found" do
        subject
        expect(response).to have_http_status(:not_found)
        expect(JSON.parse(response.body)["success"]).to be(false)
      end
    end

    context "when the user is an audience participant" do
      let!(:audience_participant) do
        create(:experience_participant, experience: experience, role: :audience)
      end

      before do
        jwt = Experiences::AuthService.jwt_for_participant(
          experience: experience,
          user: audience_participant.user
        )
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "returns forbidden" do
        subject
        expect(response).to have_http_status(:forbidden)
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

      it "returns submissions" do
        subject
        expect(response).to have_http_status(:ok)
      end
    end
  end
end
