require "rails_helper"

RSpec.describe Api::ExperienceBlocksController, type: :controller do
  include Passwordless::ControllerHelpers

  subject do
    post(
      :create,
      params: {
        experience_id: experience.code,
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
      visible_to_segments: [],
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
        end
      end
    end
  end
end
