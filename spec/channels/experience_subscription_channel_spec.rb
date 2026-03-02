require "rails_helper"

RSpec.describe ExperienceSubscriptionChannel, type: :channel do
  let(:experience) { create(:experience) }
  let(:admin) { create(:user, :admin) }
  let(:regular_user) { create(:user, :user) }

  describe "subscribing with an expired admin JWT" do
    let(:expired_token) { Experiences::AuthService.jwt_for_admin(user: admin, ttl: -1.hour) }

    it "rejects the subscription" do
      subscribe(code: experience.code_slug, token: expired_token)
      expect(subscription).to be_rejected
    end

    it "does not raise an error" do
      expect { subscribe(code: experience.code_slug, token: expired_token) }.not_to raise_error
    end
  end

  describe "subscribing with an expired participant JWT" do
    let(:participant) do
      create(:experience_participant, user: regular_user, experience: experience, role: :audience)
    end
    let(:expired_token) do
      Experiences::AuthService.jwt_for_participant(experience: experience, user: regular_user, ttl: -1.hour)
    end

    before { participant }

    it "rejects the subscription" do
      subscribe(code: experience.code_slug, token: expired_token)
      expect(subscription).to be_rejected
    end

    it "does not raise an error" do
      expect { subscribe(code: experience.code_slug, token: expired_token) }.not_to raise_error
    end
  end

  describe "subscribing without a token on a regular stream" do
    it "rejects the subscription" do
      subscribe(code: experience.code_slug)
      expect(subscription).to be_rejected
    end

    it "does not raise an error" do
      expect { subscribe(code: experience.code_slug) }.not_to raise_error
    end
  end

  describe "subscribing with a valid admin JWT" do
    let(:token) { Experiences::AuthService.jwt_for_admin(user: admin) }

    it "confirms the subscription" do
      subscribe(code: experience.code_slug, token: token)
      expect(subscription).to be_confirmed
    end

    it "streams from the admin stream" do
      subscribe(code: experience.code_slug, token: token)
      expect(subscription).to have_stream_from("experience_#{experience.id}_admins")
    end

    it "transmits initial experience state" do
      subscribe(code: experience.code_slug, token: token)
      expect(transmissions.last).to include("type" => "experience_state")
    end
  end

  describe "subscribing as a participant with a valid participant JWT" do
    let(:participant) do
      create(:experience_participant, user: regular_user, experience: experience, role: :audience)
    end
    let(:token) { Experiences::AuthService.jwt_for_participant(experience: experience, user: regular_user) }

    before { participant }

    it "confirms the subscription" do
      subscribe(code: experience.code_slug, token: token)
      expect(subscription).to be_confirmed
    end

    it "streams from the participant's individual stream" do
      subscribe(code: experience.code_slug, token: token)
      expect(subscription).to have_stream_from(
        "experience_#{experience.id}_participant_#{participant.id}"
      )
    end
  end

  describe "subscribing as a host with a valid participant JWT" do
    let(:host) do
      create(:experience_participant, user: regular_user, experience: experience, role: :host)
    end
    let(:token) { Experiences::AuthService.jwt_for_participant(experience: experience, user: regular_user) }

    before { host }

    it "confirms the subscription" do
      subscribe(code: experience.code_slug, token: token)
      expect(subscription).to be_confirmed
    end

    it "streams from the admin stream" do
      subscribe(code: experience.code_slug, token: token)
      expect(subscription).to have_stream_from("experience_#{experience.id}_admins")
    end
  end

  describe "subscribing to the monitor stream" do
    it "confirms without a token" do
      subscribe(code: experience.code_slug, view_type: "monitor")
      expect(subscription).to be_confirmed
    end

    it "streams from the monitor stream" do
      subscribe(code: experience.code_slug, view_type: "monitor")
      expect(subscription).to have_stream_from("experience_#{experience.id}_monitor")
    end

    it "does not raise an error with an expired token" do
      expired_token = Experiences::AuthService.jwt_for_admin(user: admin, ttl: -1.hour)
      expect do
        subscribe(code: experience.code_slug, view_type: "monitor", token: expired_token)
      end.not_to raise_error
    end
  end
end
