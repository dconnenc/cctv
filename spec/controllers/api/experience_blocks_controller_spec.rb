require "rails_helper"

RSpec.describe Api::ExperienceBlocksController, type: :controller do
  include Passwordless::ControllerHelpers

  subject do
    post(
      :create,
      params: {
        experience_id: experience.code_slug,
        block: block_params,
      },
      format: :json
    )
  end

  let!(:experience) { create(:experience) }
  let(:admin) { create(:user, :admin) }

  before do
    sign_in(create_passwordless_session(admin))
  end

  let(:block_params) {
    {
      kind: kind,
      payload: payload,
      status: status,
      variables: variables,
      visible_to_roles: [],
      visible_to_segment_ids: [],
      target_user_ids: []
    }
  }

  let(:status) { ExperienceBlock::HIDDEN }
  let(:payload) { {} }

  describe "POST #create" do
    describe "creating a poll" do
      let(:kind) { ExperienceBlock::POLL }

      # Refer to types.ts for the source of truth on the payload structure
      let(:payload) do
        {
          "question" => "What is the best thing?",
          "options" => ["javascript", "not javascript"],
          "pollType" => "single"
        }
      end

      context "when no variables are provided" do
        let(:variables) { nil }
        it "creates a poll with all the data needed to be playable" do
          expect { subject }.to change {
            ExperienceBlock
              .where(
                experience_id: experience.id,
                kind: ExperienceBlock::POLL
              ).count
          }.by(1)

          block = experience.experience_blocks.first

          expect(block.kind).to eql(ExperienceBlock::POLL)
          expect(block.status).to eql(status)

          # payloads are not currently validated
          expect(block.payload).to eql(payload)
        end
      end
    end

  end

  describe "POST #reorder" do
    let!(:block_a) { create(:experience_block, :announcement, experience: experience, position: 0) }
    let!(:block_b) { create(:experience_block, :announcement, experience: experience, position: 1) }
    let!(:block_c) { create(:experience_block, :announcement, experience: experience, position: 2) }

    subject do
      post(
        :reorder,
        params: {
          experience_id: experience.code_slug,
          id: block_a.id,
          position: 2,
        },
        format: :json
      )
    end

    it "updates block positions in the database" do
      subject

      expect(block_a.reload.position).to eq(2)
      expect(block_b.reload.position).to eq(0)
      expect(block_c.reload.position).to eq(1)
    end

    it "returns success with 200" do
      subject

      expect(response.status).to eql(200)
      json_response = JSON.parse(response.body)
      expect(json_response["success"]).to be(true)
    end
  end

  describe "POST #set_column" do
    let!(:block_a) { create(:experience_block, :announcement, experience: experience, position: 0) }
    let!(:block_b) { create(:experience_block, :announcement, experience: experience, position: 1) }

    subject do
      post(
        :set_column,
        params: {
          experience_id: experience.code_slug,
          id: block_a.id,
          column: 1,
        },
        format: :json
      )
    end

    it "moves only the target block without disturbing siblings" do
      subject

      expect(block_a.reload.position).to eq(1)
      expect(block_b.reload.position).to eq(1)
    end

    it "returns 200" do
      subject

      expect(response.status).to eql(200)
      expect(JSON.parse(response.body)["success"]).to be(true)
    end
  end

  describe "PATCH #update" do
    let(:player) { create(:experience_participant, :player, experience: experience) }

    subject do
      patch(
        :update,
        params: {
          experience_id: experience.code_slug,
          id: block.id,
          block: update_params,
        },
        format: :json
      )
    end

    context "updating an announcement block" do
      let(:block) { create(:experience_block, :announcement, experience: experience) }
      let(:update_params) do
        {
          payload: { "message" => "Updated message", "show_on_monitor" => false },
          visible_to_segment_ids: []
        }
      end

      it "updates the block payload and returns 200" do
        subject
        expect(response.status).to eql(200)
        block.reload
        expect(block.payload["message"]).to eql("Updated message")
      end
    end

    context "updating a poll block question text (no submissions)" do
      let(:block) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::POLL,
          payload: {
            "question" => "Old question",
            "options" => ["yes", "no"],
            "pollType" => "single"
          }
        )
      end
      let(:update_params) do
        {
          payload: {
            "question" => "New question",
            "options" => ["yes", "no"],
            "pollType" => "single"
          },
          visible_to_segment_ids: []
        }
      end

      it "updates the question text and returns 200" do
        subject
        expect(response.status).to eql(200)
        block.reload
        expect(block.payload["question"]).to eql("New question")
      end
    end

    context "updating a poll block with changed options when submissions exist" do
      let(:block) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::POLL,
          payload: {
            "question" => "Favorite color?",
            "options" => ["red", "blue"],
            "pollType" => "single"
          }
        )
      end
      let(:update_params) do
        {
          payload: {
            "question" => "Favorite color?",
            "options" => ["red", "green"],
            "pollType" => "single"
          },
          visible_to_segment_ids: []
        }
      end

      before do
        create(:experience_poll_submission, experience_block: block, user: player.user)
      end

      it "clears submissions and returns 200" do
        expect { subject }.to change { ExperiencePollSubmission.count }.by(-1)
        expect(response.status).to eql(200)
      end
    end

    context "updating a family feud block with child submissions" do
      let(:block) { create(:experience_block, :family_feud, experience: experience) }
      let(:update_params) do
        {
          payload: { "title" => "Updated Title" },
          visible_to_segment_ids: []
        }
      end

      before do
        child = block.child_blocks.first
        create(:experience_question_submission, experience_block: child, user: player.user)
      end

      it "allows the edit and returns 200" do
        subject
        expect(response.status).to eql(200)
        expect(block.reload.payload["title"]).to eql("Updated Title")
      end
    end

    context "propagating question edits to family feud child blocks" do
      let(:block) { create(:experience_block, :family_feud, experience: experience) }
      let(:child) { block.child_blocks.first }
      let(:update_params) do
        {
          payload: { "title" => "New Title" },
          visible_to_segment_ids: [],
          questions: [{ id: child.id, question: "Updated question text" }]
        }
      end

      it "updates the child block question text" do
        subject
        expect(response.status).to eql(200)
        child.reload
        expect(child.payload["question"]).to eql("Updated question text")
      end
    end

    context "when actor is not a host or admin" do
      let(:regular_user) { create(:user, :user) }
      let(:participant) { create(:experience_participant, user: regular_user, experience: experience, role: :audience) }
      let(:block) { create(:experience_block, :announcement, experience: experience) }
      let(:update_params) do
        { payload: { "message" => "Changed" }, visible_to_segment_ids: [] }
      end

      before do
        participant
        jwt = Experiences::AuthService.jwt_for_participant(experience: experience, user: regular_user)
        request.headers["Authorization"] = "Bearer #{jwt}"
      end

      it "returns 403 forbidden" do
        subject
        expect(response.status).to eql(403)
      end
    end
  end

  describe "POST #submit_poll_response" do
    let(:audience_user) { create(:user, :user) }
    let!(:audience_participant) { create(:experience_participant, user: audience_user, experience: experience, role: :audience) }
    let!(:block) { create(:experience_block, experience: experience, kind: ExperienceBlock::POLL, status: :open) }

    subject do
      post(
        :submit_poll_response,
        params: {
          experience_id: experience.code_slug,
          id: block.id,
          answer: { "selectedOptions" => ["option_a"] }
        },
        format: :json
      )
    end

    before do
      jwt = Experiences::AuthService.jwt_for_participant(experience: experience, user: audience_user)
      request.headers["Authorization"] = "Bearer #{jwt}"
    end

    it "returns the submission in the response" do
      subject

      json = JSON.parse(response.body)
      expect(response.status).to eql(200)
      expect(json["success"]).to be(true)
      expect(json["submission"]["id"]).to be_present
      expect(json["submission"]["answer"]["selectedOptions"]).to eq(["option_a"])
    end

    context "when the block is closed" do
      let!(:block) { create(:experience_block, experience: experience, kind: ExperienceBlock::POLL, status: :closed) }

      it "returns 403 forbidden" do
        subject
        expect(response.status).to eql(403)
      end
    end

    context "when the block has role-based visibility that excludes the participant" do
      let!(:block) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::POLL,
          status: :open,
          visible_to_roles: ["host"]
        )
      end

      it "returns 403 forbidden" do
        subject
        expect(response.status).to eql(403)
      end
    end
  end

  describe "POST #submit_buzzer_response" do
    let(:audience_user) { create(:user, :user) }
    let!(:audience_participant) { create(:experience_participant, user: audience_user, experience: experience, role: :audience) }
    let!(:block) { create(:experience_block, experience: experience, kind: ExperienceBlock::BUZZER, status: :open) }

    subject do
      post(
        :submit_buzzer_response,
        params: {
          experience_id: experience.code_slug,
          id: block.id,
          answer: { "buzzed_at" => Time.current.iso8601 }
        },
        format: :json
      )
    end

    before do
      jwt = Experiences::AuthService.jwt_for_participant(experience: experience, user: audience_user)
      request.headers["Authorization"] = "Bearer #{jwt}"
    end

    it "returns the submission in the response" do
      subject

      json = JSON.parse(response.body)
      expect(response.status).to eql(200)
      expect(json["success"]).to be(true)
      expect(json["submission"]["id"]).to be_present
      expect(json["submission"]["answer"]["buzzed_at"]).to be_present
    end
  end
end
