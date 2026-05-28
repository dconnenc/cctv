require "rails_helper"

RSpec.describe Api::ExperiencesController, type: :controller do
  include Passwordless::ControllerHelpers

  let!(:experience) { create(:experience, status: :draft) }
  let(:admin) { create(:user, :admin) }

  before do
    sign_in(create_passwordless_session(admin))
  end

  shared_examples "requires manage or host access" do
    context "when the user is an audience participant" do
      let(:audience_user) { create(:user, :user) }
      let!(:audience_participant) do
        create(
          :experience_participant,
          user: audience_user,
          experience: experience,
          role: :audience
        )
      end

      before do
        jwt = Experiences::AuthService.jwt_for_participant(
          experience: experience,
          user: audience_user
        )
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "returns 403 forbidden" do
        subject
        expect(response.status).to eql(403)
      end
    end

    context "when the user is a host" do
      let(:host_user) { create(:user, :user) }
      let!(:host_participant) do
        create(
          :experience_participant,
          user: host_user,
          experience: experience,
          role: :host
        )
      end

      before do
        jwt = Experiences::AuthService.jwt_for_participant(
          experience: experience,
          user: host_user
        )
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "does not return 403" do
        subject
        expect(response.status).not_to eql(403)
      end
    end
  end

  describe "POST #open_lobby" do
    subject do
      post(:open_lobby, params: { id: experience.code_slug }, format: :json)
    end

    it_behaves_like "requires manage or host access"

    it "transitions the experience to lobby" do
      subject
      expect(experience.reload.status).to eq("lobby")
    end
  end

  describe "POST #start" do
    subject do
      post(:start, params: { id: experience.code_slug }, format: :json)
    end

    it_behaves_like "requires manage or host access"

    it "transitions the experience to live" do
      subject
      expect(experience.reload.status).to eq("live")
    end
  end

  describe "POST #pause" do
    before { experience.update!(status: :live) }

    subject do
      post(:pause, params: { id: experience.code_slug }, format: :json)
    end

    it_behaves_like "requires manage or host access"

    it "transitions the experience to paused" do
      subject
      expect(experience.reload.status).to eq("paused")
    end
  end

  describe "POST #resume" do
    before { experience.update!(status: :paused) }

    subject do
      post(:resume, params: { id: experience.code_slug }, format: :json)
    end

    it_behaves_like "requires manage or host access"

    it "transitions the experience to live" do
      subject
      expect(experience.reload.status).to eq("live")
    end
  end

  describe "POST #clear_avatars" do
    subject do
      post(:clear_avatars, params: { id: experience.code_slug }, format: :json)
    end

    it_behaves_like "requires manage or host access"

    let!(:participant) do
      create(:experience_participant, :with_avatar, experience: experience)
    end

    it "clears all participant avatars" do
      subject

      expect(participant.reload.avatar).to eq({})
    end
  end

  describe "PATCH #update_playbill" do
    let(:playbill) { [{ "title" => "Act 1", "body" => "Content" }] }

    subject do
      patch(
        :update_playbill,
        params: { id: experience.code_slug, playbill: playbill },
        format: :json
      )
    end

    it_behaves_like "requires manage or host access"

    it "updates the experience playbill" do
      subject
      expect(experience.reload.playbill).to eq(playbill)
    end
  end

  describe "POST #create" do
    let(:code) { "SHOW#{rand(100_000)}" }
    let(:params) { { experience: { name: "Show", code: code } } }

    before do
      post(:create, params: params, format: :json)
    end

    let(:created) do
      Experience.find(JSON.parse(response.body)["experience"]["id"])
    end

    it "seeds an Audience default segment when no name is provided" do
      expect(created.default_segment.name).to eq("Audience")
    end

    context "with a custom default_segment_name" do
      let(:params) do
        super().deep_merge(experience: { default_segment_name: "Crowd" })
      end

      it "uses the custom name" do
        expect(created.default_segment.name).to eq("Crowd")
      end
    end

    context "when default_segment_name is blank" do
      let(:params) do
        super().deep_merge(experience: { default_segment_name: "  " })
      end

      it "falls back to Audience" do
        expect(created.default_segment.name).to eq("Audience")
      end
    end
  end
end
