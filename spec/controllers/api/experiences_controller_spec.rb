require "rails_helper"

RSpec.describe Api::ExperiencesController, type: :controller do
  include Passwordless::ControllerHelpers

  let!(:experience) { create(:experience, status: :draft) }
  let(:admin) { create(:user, :admin) }

  before do
    sign_in(create_passwordless_session(admin))
  end

  shared_examples "requires manage_blocks or host access" do |http_method, action_name, extra_params|
    context "when the user is an audience participant" do
      let(:audience_user) { create(:user, :user) }
      let!(:audience_participant) { create(:experience_participant, user: audience_user, experience: experience, role: :audience) }

      before do
        jwt = Experiences::AuthService.jwt_for_participant(experience: experience, user: audience_user)
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "returns 403 forbidden" do
        public_send(http_method, action_name, params: { id: experience.code_slug }.merge(extra_params || {}), format: :json)
        expect(response.status).to eql(403)
      end
    end

    context "when the user is a host" do
      let(:host_user) { create(:user, :user) }
      let!(:host_participant) { create(:experience_participant, user: host_user, experience: experience, role: :host) }

      before do
        jwt = Experiences::AuthService.jwt_for_participant(experience: experience, user: host_user)
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "does not return 403" do
        broadcaster = instance_double(Experiences::Broadcaster, broadcast_experience_update: true)
        allow(Experiences::Broadcaster).to receive(:new).and_return(broadcaster)

        public_send(http_method, action_name, params: { id: experience.code_slug }.merge(extra_params || {}), format: :json)
        expect(response.status).not_to eql(403)
      end
    end
  end

  describe "POST #open_lobby" do
    it_behaves_like "requires manage_blocks or host access", :post, :open_lobby, {}
  end

  describe "POST #start" do
    it_behaves_like "requires manage_blocks or host access", :post, :start, {}
  end

  describe "POST #pause" do
    before { experience.update!(status: :live) }

    it_behaves_like "requires manage_blocks or host access", :post, :pause, {}
  end

  describe "POST #resume" do
    before { experience.update!(status: :paused) }

    it_behaves_like "requires manage_blocks or host access", :post, :resume, {}
  end

  describe "POST #clear_avatars" do
    it_behaves_like "requires manage_blocks or host access", :post, :clear_avatars, {}
  end

  describe "PATCH #update_playbill" do
    it_behaves_like "requires manage_blocks or host access", :patch, :update_playbill, { playbill: [] }
  end
end
