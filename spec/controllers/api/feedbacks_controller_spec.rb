require "rails_helper"

RSpec.describe Api::FeedbacksController, type: :controller do
  include Passwordless::ControllerHelpers
  include ActiveJob::TestHelper

  let(:user) { create(:user) }

  let(:base_params) do
    {
      feedback: {
        feedback_type: Feedback::BUG,
        source: Feedback::MANUAL,
        title: "Poll never opened",
        description: "I tapped the option and nothing happened.",
        context: { route: "/experiences/:code", url: "https://cctv.test/experiences/abc" },
        console_logs: [{ level: "error", message: "websocket closed" }]
      }
    }
  end

  describe "POST #create" do
    context "when signed in" do
      before { sign_in(create_passwordless_session(user)) }

      it "records the feedback and queues the Linear sync" do
        expect {
          post :create, params: base_params, format: :json
        }.to change(Feedback, :count).by(1)

        expect(response).to have_http_status(:created)

        feedback = Feedback.last
        expect(feedback).to have_attributes(
          user: user,
          feedback_type: "bug",
          source: "manual",
          title: "Poll never opened",
        )
        expect(Feedbacks::SyncToLinearJob).to have_been_enqueued.with(feedback.id, feedback.linear_group_key)
      end

      it "keeps only permitted context keys" do
        params = base_params.deep_merge(feedback: { context: { cookies: "session=secret" } })

        post :create, params: params, format: :json

        expect(Feedback.last.context).not_to have_key("cookies")
      end

      it "scrubs credentials out of console output" do
        jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.s1gnatur3"
        params = base_params.deep_merge(
          feedback: { console_logs: [{ level: "error", message: "sent #{jwt}" }] },
        )

        post :create, params: params, format: :json

        expect(Feedback.last.console_logs.first["message"]).not_to include(jwt)
      end

      it "keeps array context values like segments and visible block kinds" do
        params = base_params.deep_merge(
          feedback: {
            context: {
              segment_names: %w[front-row balcony],
              visible_block_kinds: %w[poll announcement]
            }
          },
        )

        post :create, params: params, format: :json

        expect(Feedback.last.context).to include(
          "segment_names" => %w[front-row balcony],
          "visible_block_kinds" => %w[poll announcement],
        )
      end

      it "rejects feedback with no description" do
        params = base_params.deep_merge(feedback: { description: "" })

        post :create, params: params, format: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "attaches the feedback to the experience when a code is given" do
        experience = create(:experience)
        params = base_params.deep_merge(feedback: { experience_code: experience.code_slug })

        post :create, params: params, format: :json

        expect(Feedback.last.experience).to eq(experience)
      end

      it "delays the sync for an auto-filed error so the reporter can add detail first" do
        params = base_params.deep_merge(
          feedback: { source: Feedback::ERROR, description: "", error_fingerprint: "abc123" },
        )

        post :create, params: params, format: :json

        expect(response).to have_http_status(:created)
        expect(Feedbacks::SyncToLinearJob).to have_been_enqueued.at(a_value > Time.current)
      end
    end

    context "when signed out" do
      it "refuses manual feedback" do
        expect {
          post :create, params: base_params, format: :json
        }.not_to change(Feedback, :count)

        expect(response).to have_http_status(:unauthorized)
      end

      it "still records an error report, since a logged-out visitor hits real bugs" do
        params = base_params.deep_merge(
          feedback: { source: Feedback::ERROR, description: "", error_fingerprint: "abc123" },
        )

        expect {
          post :create, params: params, format: :json
        }.to change(Feedback, :count).by(1)

        expect(Feedback.last.user).to be_nil
      end
    end

    context "when the reporter is over the rate limit" do
      before do
        sign_in(create_passwordless_session(user))
        allow(Feedbacks::RateLimiter).to receive(:allow?).and_return(false)
      end

      it "refuses without recording" do
        expect {
          post :create, params: base_params, format: :json
        }.not_to change(Feedback, :count)

        expect(response).to have_http_status(:too_many_requests)
      end
    end
  end

  describe "PATCH #update" do
    before { sign_in(create_passwordless_session(user)) }

    it "adds the reporter's account of an error that is still waiting to sync" do
      feedback = create(:feedback, :error_report, user: user)

      patch :update,
        params: { id: feedback.id, feedback: { description: "I hit submit twice" } },
        format: :json

      expect(response).to have_http_status(:ok)
      expect(feedback.reload.description).to eq("I hit submit twice")
      expect(Feedbacks::AppendEnrichmentJob).not_to have_been_enqueued
    end

    it "comments on Linear when the issue was already created" do
      feedback = create(:feedback, :error_report, :synced, user: user)

      patch :update,
        params: { id: feedback.id, feedback: { description: "I hit submit twice" } },
        format: :json

      expect(Feedbacks::AppendEnrichmentJob).to have_been_enqueued.with(feedback.id)
    end

    it "will not let one user edit another's report" do
      feedback = create(:feedback, :error_report, user: create(:user))

      patch :update,
        params: { id: feedback.id, feedback: { description: "nope" } },
        format: :json

      expect(response).to have_http_status(:not_found)
    end
  end
end
