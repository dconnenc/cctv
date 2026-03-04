require "rails_helper"

RSpec.describe ExperienceSubscriptionChannel, type: :channel do
  let(:experience) { create(:experience) }
  let(:admin) { create(:user, :admin) }
  let(:regular_user) { create(:user, :user) }

  describe "subscribing with an expired admin JWT" do
    let(:expired_token) do
      Experiences::AuthService.jwt_for_admin(user: admin, ttl: -1.hour)
    end

    it "rejects the subscription" do
      subscribe(code: experience.code_slug, token: expired_token)
      expect(subscription).to be_rejected
    end

    it "does not raise an error" do
      expect {
        subscribe(code: experience.code_slug, token: expired_token)
      }.not_to raise_error
    end
  end

  describe "subscribing with an expired participant JWT" do
    let(:participant) do
      create(
        :experience_participant,
        user: regular_user,
        experience: experience,
        role: :audience
      )
    end

    let(:expired_token) do
      Experiences::AuthService.jwt_for_participant(
        experience: experience, user: regular_user, ttl: -1.hour
      )
    end

    before { participant }

    it "rejects the subscription" do
      subscribe(code: experience.code_slug, token: expired_token)

      expect(subscription).to be_rejected
    end

    it "does not raise an error" do
      expect {
        subscribe(code: experience.code_slug, token: expired_token)
      }.not_to raise_error
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
      create(
        :experience_participant,
        user: regular_user,
        experience: experience,
        role: :audience
      )
    end

    let(:token) do
      Experiences::AuthService.jwt_for_participant(
        experience: experience, user: regular_user
      )
    end

    before { participant }

    it "confirms the subscription" do
      subscribe(code: experience.code_slug, token: token)

      expect(subscription).to be_confirmed
    end

    # NOTE: This will be a generic stream in the future where client side data
    # is kept on the client. For now, we have a stream p/ participant
    it "streams from the participant's individual stream" do
      subscribe(code: experience.code_slug, token: token)

      expect(subscription).to have_stream_from(
        "experience_#{experience.id}_participant_#{participant.id}"
      )
    end
  end

  describe "subscribing as a host with a valid participant JWT" do
    let(:host) do
      create(
        :experience_participant,
        user: regular_user,
        experience: experience,
        role: :host
      )
    end

    let(:token) do
      Experiences::AuthService.jwt_for_participant(
        experience: experience, user: regular_user
      )
    end

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

    context "when participants have committed avatars" do
      let(:participant_with_avatar) do
        create(
          :experience_participant,
          user: regular_user,
          experience: experience,
          role: :audience,
          avatar: { "strokes" => [{ "points" => [1, 2, 3, 4], "color" => "#ff0000", "width" => 4 }] }
        )
      end

      before { participant_with_avatar }

      it "transmits avatar_committed drawing_update for each participant with strokes" do
        subscribe(code: experience.code_slug, view_type: "monitor")

        avatar_transmissions = transmissions.select { |t| t["type"] == "drawing_update" }
        expect(avatar_transmissions).to include(
          hash_including(
            "type" => "drawing_update",
            "participant_id" => participant_with_avatar.id,
            "operation" => "avatar_committed"
          )
        )
      end

      it "does not transmit avatar_committed for participants with no avatar" do
        create(:experience_participant, user: create(:user, :user), experience: experience, role: :audience)

        subscribe(code: experience.code_slug, view_type: "monitor")

        avatar_transmissions = transmissions.select { |t| t["type"] == "drawing_update" }
        expect(avatar_transmissions.length).to eq(1)
      end
    end
  end

  describe "#drawing_event" do
    let(:participant) do
      create(:experience_participant, user: regular_user, experience: experience, role: :audience)
    end

    let(:token) do
      Experiences::AuthService.jwt_for_participant(experience: experience, user: regular_user)
    end

    let(:monitor_stream_key) { "experience_#{experience.id}_monitor" }

    before do
      participant
      subscribe(code: experience.code_slug, token: token)
    end

    describe "stroke_started" do
      it "broadcasts the event to the monitor stream" do
        expect do
          perform(:drawing_event, {
            "operation" => "stroke_started",
            "data" => { "points" => [10, 20], "color" => "#ff0000", "width" => 4 }
          })
        end.to have_broadcasted_to(monitor_stream_key).with(
          hash_including(
            "type" => "drawing_update",
            "participant_id" => participant.id,
            "operation" => "stroke_started"
          )
        )
      end

      it "does not persist anything to the database" do
        perform(:drawing_event, {
          "operation" => "stroke_started",
          "data" => { "points" => [10, 20], "color" => "#ff0000", "width" => 4 }
        })

        expect(participant.reload.avatar).to be_blank
      end
    end

    describe "stroke_points_appended" do
      before do
        perform(:drawing_event, {
          "operation" => "stroke_started",
          "data" => { "points" => [10, 20], "color" => "#ff0000", "width" => 4 }
        })
      end

      it "broadcasts the points to the monitor stream" do
        expect do
          perform(:drawing_event, {
            "operation" => "stroke_points_appended",
            "data" => { "points" => [30, 40, 50, 60] }
          })
        end.to have_broadcasted_to(monitor_stream_key).with(
          hash_including("type" => "drawing_update", "operation" => "stroke_points_appended")
        )
      end

      it "does not write to the database" do
        expect {
          perform(:drawing_event, {
            "operation" => "stroke_points_appended",
            "data" => { "points" => [30, 40] }
          })
        }.not_to change { participant.reload.updated_at }
      end

      it "does not broadcast an experience_updated message to participant streams" do
        perform(:drawing_event, {
          "operation" => "stroke_points_appended",
          "data" => { "points" => [30, 40] }
        })

        participant_stream = "experience_#{experience.id}_participant_#{participant.id}"
        expect(broadcasts(participant_stream)).to be_empty
      end
    end

    describe "stroke_ended" do
      before do
        perform(:drawing_event, {
          "operation" => "stroke_started",
          "data" => { "points" => [10, 20], "color" => "#ff0000", "width" => 4 }
        })
        perform(:drawing_event, {
          "operation" => "stroke_points_appended",
          "data" => { "points" => [30, 40] }
        })
      end

      it "appends the completed stroke to the participant's avatar" do
        perform(:drawing_event, { "operation" => "stroke_ended" })

        avatar = participant.reload.avatar
        expect(avatar["strokes"].length).to eq(1)
        expect(avatar["strokes"].first).to include(
          "color" => "#ff0000",
          "width" => 4
        )
        expect(avatar["strokes"].first["points"]).to include(10, 20, 30, 40)
      end

      it "broadcasts the event to the monitor stream" do
        expect do
          perform(:drawing_event, { "operation" => "stroke_ended" })
        end.to have_broadcasted_to(monitor_stream_key).with(
          hash_including("type" => "drawing_update", "operation" => "stroke_ended")
        )
      end

      it "accumulates multiple strokes" do
        perform(:drawing_event, { "operation" => "stroke_ended" })
        perform(:drawing_event, {
          "operation" => "stroke_started",
          "data" => { "points" => [50, 60], "color" => "#0000ff", "width" => 2 }
        })
        perform(:drawing_event, { "operation" => "stroke_ended" })

        expect(participant.reload.avatar["strokes"].length).to eq(2)
      end

      it "does not broadcast an experience_updated message to participant streams" do
        perform(:drawing_event, { "operation" => "stroke_ended" })

        participant_stream = "experience_#{experience.id}_participant_#{participant.id}"
        expect(broadcasts(participant_stream)).to be_empty
      end
    end

    describe "canvas_cleared" do
      context "when the participant has existing avatar strokes" do
        before do
          participant.update!(avatar: {
            "strokes" => [{ "points" => [1, 2, 3, 4], "color" => "#ff0000", "width" => 4 }]
          })
        end

        it "clears the participant's avatar in the database" do
          perform(:drawing_event, { "operation" => "canvas_cleared" })

          expect(participant.reload.avatar).to eq({})
        end

        it "broadcasts a canvas_cleared drawing_update to the monitor stream" do
          expect do
            perform(:drawing_event, { "operation" => "canvas_cleared" })
          end.to have_broadcasted_to(monitor_stream_key).with(
            hash_including(
              "type" => "drawing_update",
              "participant_id" => participant.id,
              "operation" => "canvas_cleared"
            )
          )
        end

        it "does not broadcast to participant streams" do
          perform(:drawing_event, { "operation" => "canvas_cleared" })

          participant_stream = "experience_#{experience.id}_participant_#{participant.id}"
          expect(broadcasts(participant_stream)).to be_empty
        end
      end

      context "when an in-progress stroke exists" do
        before do
          perform(:drawing_event, {
            "operation" => "stroke_started",
            "data" => { "points" => [10, 20], "color" => "#ff0000", "width" => 4 }
          })
        end

        it "discards the in-progress stroke" do
          perform(:drawing_event, { "operation" => "canvas_cleared" })
          perform(:drawing_event, { "operation" => "stroke_ended" })

          expect(participant.reload.avatar).to eq({})
        end
      end

      context "when the participant has no avatar" do
        it "does not raise an error" do
          expect do
            perform(:drawing_event, { "operation" => "canvas_cleared" })
          end.not_to raise_error
        end

        it "broadcasts the canvas_cleared event to the monitor stream" do
          expect do
            perform(:drawing_event, { "operation" => "canvas_cleared" })
          end.to have_broadcasted_to(monitor_stream_key).with(
            hash_including("type" => "drawing_update", "operation" => "canvas_cleared")
          )
        end
      end
    end

    describe "authorization" do
      it "ignores drawing events from admins" do
        admin_token = Experiences::AuthService.jwt_for_admin(user: admin)
        subscribe(code: experience.code_slug, token: admin_token)

        expect do
          perform(:drawing_event, {
            "operation" => "stroke_started",
            "data" => { "points" => [10, 20], "color" => "#ff0000", "width" => 4 }
          })
        end.not_to have_broadcasted_to(monitor_stream_key)
      end

      it "ignores drawing events from monitor subscribers" do
        subscribe(code: experience.code_slug, view_type: "monitor")

        expect do
          perform(:drawing_event, {
            "operation" => "stroke_started",
            "data" => { "points" => [10, 20], "color" => "#ff0000", "width" => 4 }
          })
        end.not_to have_broadcasted_to(monitor_stream_key)
      end
    end
  end
end
