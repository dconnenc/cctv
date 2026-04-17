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

    describe "creating a mad lib" do
      let(:kind) { ExperienceBlock::MAD_LIB }

      # Refer to types.ts for the source of truth on the payload structure
      let(:payload) do
        {
          "segments" => [
            { "id" => "1", "type" => "text", "content" => "I love " },
            { "id" => "2", "type" => "variable", "content" => "thing" },
            { "id" => "3", "type" => "text", "content" => " and " },
            { "id" => "4", "type" => "variable", "content" => "activity" },
          ]
        }
      end

      context "when no variables are provided" do
        let(:variables) { nil }

        it "creates a mad lib with all the data needed to be playable" do
          expect { subject }.to change {
            ExperienceBlock
              .where(
                experience_id: experience.id,
                kind: ExperienceBlock::MAD_LIB
              ).count
          }.by(1)

          block = experience.experience_blocks.first

          expect(block.kind).to eql(ExperienceBlock::MAD_LIB)
          expect(block.status).to eql(status)
          expect(block.payload).to eql(payload)
        end
      end

      context "when variables are provided" do
        let(:participant) do
          create(:experience_participant, experience: experience)
        end

        let(:variables) do
          [
            {
              key: "thing",
              label: "Favorite thing",
              datatype: "string",
              required: true,
              source: {
                type: "participant",
                participant_id: participant.id
              }
            },
            {
              key: "activity",
              label: "Favorite activity",
              datatype: "string",
              required: true,
              source: {
                type: "block",
                kind: ExperienceBlock::POLL,
                payload: {
                  question: "What is your favorite activity?",
                  options: ["coding", "reading", "gaming"],
                  pollType: "single"
                }
              }
            }
          ]
        end

        it "creates a mad lib with dependencies represented as a DAG" do
          # DAG Structure:
          #
          #   mad_lib (parent)
          #   ├── question_block (sources "thing" variable)
          #   └── poll_block (sources "activity" variable)
          #
          # The mad lib depends on two child blocks. Each child block
          # provides data for one variable through a variable binding.

          broadcaster = instance_double(
            Experiences::Broadcaster,
            broadcast_experience_update: true
          )
          allow(Experiences::Broadcaster).to receive(:new).and_return(
            broadcaster
          )

          expect { subject }.to change {
            ExperienceBlock
              .where(
                experience_id: experience.id,
                kind: ExperienceBlock::MAD_LIB
              ).count
          }.by(1).and change {
            ExperienceBlock
              .where(
                experience_id: experience.id,
                kind: ExperienceBlock::POLL
              ).count
          }.by(1).and change {
            ExperienceBlock
              .where(
                experience_id: experience.id,
                kind: ExperienceBlock::QUESTION
              ).count
          }.by(1)

          mad_lib_block = experience.experience_blocks.where(
            kind: ExperienceBlock::MAD_LIB
          ).last
          poll_block = experience.experience_blocks.where(
            kind: ExperienceBlock::POLL
          ).last
          question_block = experience.experience_blocks.where(
            kind: ExperienceBlock::QUESTION
          ).last

          # Verify mad lib block structure
          expect(mad_lib_block.kind).to eql(ExperienceBlock::MAD_LIB)
          expect(mad_lib_block.status).to eql(status)
          expect(mad_lib_block.payload).to eql(payload)

          # Verify two variables were created
          expect(mad_lib_block.variables.count).to eql(2)

          # Verify "thing" variable configuration and binding
          thing_variable = mad_lib_block.variables.find_by(
            key: "thing"
          )
          expect(thing_variable.label).to eql("Favorite thing")
          expect(thing_variable.datatype).to eql("string")
          expect(thing_variable.required).to be(true)
          expect(thing_variable.bindings.count).to eql(1)
          expect(thing_variable.bindings.first.source_block_id).to eql(
            question_block.id
          )

          # Verify "activity" variable configuration and binding
          activity_variable = mad_lib_block.variables.find_by(
            key: "activity"
          )
          expect(activity_variable.label).to eql("Favorite activity")
          expect(activity_variable.datatype).to eql("string")
          expect(activity_variable.required).to be(true)
          expect(activity_variable.bindings.count).to eql(1)
          expect(activity_variable.bindings.first.source_block_id).to eql(
            poll_block.id
          )

          # Verify DAG links: mad lib has two children
          expect(mad_lib_block.children.count).to eql(2)
          expect(mad_lib_block.children).to include(poll_block)
          expect(mad_lib_block.children).to include(question_block)

          # Verify question block was created for participant
          expect(question_block.kind).to eql(
            ExperienceBlock::QUESTION
          )
          expect(question_block.target_user_ids).to eql(
            [participant.user_id]
          )
          expect(question_block.payload["question"]).to eql(
            "Favorite thing"
          )

          # Verify poll block was created with provided payload
          expect(poll_block.kind).to eql(ExperienceBlock::POLL)
          expect(poll_block.payload).to eql({
            "question" => "What is your favorite activity?",
            "options" => ["coding", "reading", "gaming"],
            "pollType" => "single"
          })

          # Verify broadcaster was called
          expect(broadcaster).to have_received(
            :broadcast_experience_update
          )

          # Verify response format and status
          expect(response.status).to eql(200)
          json_response = JSON.parse(response.body)
          expect(json_response["success"]).to be(true)
          expect(json_response["data"]["id"]).to eql(mad_lib_block.id)
          expect(json_response["data"]["kind"]).to eql("mad_lib")
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
      broadcaster = instance_double(Experiences::Broadcaster, broadcast_experience_update: true)
      allow(Experiences::Broadcaster).to receive(:new).and_return(broadcaster)

      subject

      expect(block_a.reload.position).to eq(2)
      expect(block_b.reload.position).to eq(0)
      expect(block_c.reload.position).to eq(1)
    end

    it "calls the broadcaster" do
      broadcaster = instance_double(Experiences::Broadcaster, broadcast_experience_update: true)
      allow(Experiences::Broadcaster).to receive(:new).and_return(broadcaster)

      subject

      expect(broadcaster).to have_received(:broadcast_experience_update)
    end

    it "returns success with 200" do
      broadcaster = instance_double(Experiences::Broadcaster, broadcast_experience_update: true)
      allow(Experiences::Broadcaster).to receive(:new).and_return(broadcaster)

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
      broadcaster = instance_double(Experiences::Broadcaster, broadcast_experience_update: true)
      allow(Experiences::Broadcaster).to receive(:new).and_return(broadcaster)

      subject

      expect(block_a.reload.position).to eq(1)
      expect(block_b.reload.position).to eq(1)
    end

    it "broadcasts the update and returns 200" do
      broadcaster = instance_double(Experiences::Broadcaster, broadcast_experience_update: true)
      allow(Experiences::Broadcaster).to receive(:new).and_return(broadcaster)

      subject

      expect(broadcaster).to have_received(:broadcast_experience_update)
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

    context "updating a mad lib when submissions exist" do
      let(:block) { create(:experience_block, :mad_lib, experience: experience) }
      let(:update_params) do
        {
          payload: { "parts" => [{ "id" => "1", "type" => "text", "content" => "hello" }] },
          visible_to_segment_ids: []
        }
      end

      before do
        create(:experience_mad_lib_submission, experience_block: block, user: player.user)
      end

      it "returns 422 with an error message" do
        subject
        expect(response.status).to eql(422)
        json = JSON.parse(response.body)
        expect(json["success"]).to be(false)
        expect(json["error"]).to match(/Cannot edit a Mad Lib while it is active/)
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

    context "re-syncing mad lib variables" do
      let(:block) { create(:experience_block, :mad_lib, experience: experience) }
      let(:update_params) do
        {
          payload: { "parts" => [] },
          visible_to_segment_ids: [],
          variables: [
            { key: "newvar", label: "New Variable", datatype: "string", required: true }
          ]
        }
      end

      before do
        block.variables.create!(key: "oldvar", label: "Old Variable", datatype: "string", required: true)
      end

      it "destroys old variables and creates new ones" do
        subject
        expect(response.status).to eql(200)
        block.reload
        expect(block.variables.pluck(:key)).to contain_exactly("newvar")
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
      broadcaster = instance_double(Experiences::Broadcaster, broadcast_experience_update: true)
      allow(Experiences::Broadcaster).to receive(:new).and_return(broadcaster)

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
      broadcaster = instance_double(Experiences::Broadcaster, broadcast_experience_update: true)
      allow(Experiences::Broadcaster).to receive(:new).and_return(broadcaster)

      subject

      json = JSON.parse(response.body)
      expect(response.status).to eql(200)
      expect(json["success"]).to be(true)
      expect(json["submission"]["id"]).to be_present
      expect(json["submission"]["answer"]["buzzed_at"]).to be_present
    end
  end
end
