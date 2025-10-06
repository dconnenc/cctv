require "rails_helper"

RSpec.describe Experiences::Broadcaster do
  let(:experience) { create(:experience) }
  let(:broadcaster) { described_class.new(experience) }
  let(:broadcast_calls) { [] }

  before do
    allow(broadcaster).to receive(:send_broadcast) do |stream_key, message|
      broadcast_calls << { stream_key: stream_key, message: message }
    end
  end

  def broadcast_call_for(calls, participant)
    calls.find do |call|
      call[:stream_key].include?("participant_#{participant.id}")
    end
  end

  describe "#broadcast_experience_update" do
    subject { broadcaster.broadcast_experience_update }

    context "with no participants" do
      it "does not broadcast anything" do
        subject
        expect(broadcast_calls).to be_empty
      end
    end

    context "with participants and no blocks" do
      let!(:participant) do
        create(:experience_participant, experience: experience)
      end

      before { subject }

      it "broadcasts one message" do
        expect(broadcast_calls.size).to eq(1)
      end

      it "broadcasts with empty blocks array" do
        message = broadcast_call_for(broadcast_calls, participant)
        expect(message[:message][:experience][:blocks]).to eq([])
      end
    end

    context "with a simple block" do
      let!(:participant) do
        create(:experience_participant, experience: experience)
      end

      let!(:block) do
        create(:experience_block, experience: experience, status: :open)
      end

      before { subject }

      it "sends one block to participant" do
        message = broadcast_call_for(broadcast_calls, participant)
        expect(message[:message][:experience][:blocks].size).to eq(1)
        expect(message[:message][:experience][:blocks].first[:id]).to eq(
          block.id
        )
      end
    end

    context "with a sourced mad lib" do
      # DAG Structure:
      #
      #   mad_lib (parent)
      #   ├── question_block (targeted to question_participant)
      #   └── poll_block (open to all)
      #
      # Expected behavior:
      # - question_participant sees question_block
      # - poll_participant sees poll_block
      # - host sees mad_lib with all children

      let!(:question_participant) do
        create(:experience_participant, experience: experience)
      end

      let!(:poll_participant) do
        create(:experience_participant, experience: experience)
      end

      let!(:host_participant) do
        create(
          :experience_participant,
          experience: experience,
          role: :host
        )
      end

      let!(:mad_lib) do
        create(
          :experience_block,
          :mad_lib_sourced,
          experience: experience,
          status: :open,
          participant_for_question: question_participant
        )
      end

      context "initial state" do
        before { subject }

          it "sends question block to question participant" do
          message = broadcast_call_for(
            broadcast_calls,
            question_participant
          )
          blocks = message[:message][:experience][:blocks]

          expect(blocks.size).to eq(1)
          expect(blocks.first[:kind]).to eq("question")
          expect(blocks.first[:payload]["question"]).to eq(
            "Favorite thing"
          )
        end

        it "sends poll block to poll participant" do
          message = broadcast_call_for(
            broadcast_calls,
            poll_participant
          )
          blocks = message[:message][:experience][:blocks]

          expect(blocks.size).to eq(1)
          expect(blocks.first[:kind]).to eq("poll")
          expect(blocks.first[:payload]["question"]).to eq(
            "What is your favorite activity?"
          )
        end

        it "sends all blocks to host participant" do
          message = broadcast_call_for(
            broadcast_calls,
            host_participant
          )
          blocks = message[:message][:experience][:blocks]

          block_kinds = blocks.map { |b| b[:kind] }
          
          expect(blocks.size).to eq(3), 
            "Expected 3 blocks but got #{blocks.size}: #{block_kinds}"
          expect(block_kinds).to include("mad_lib")
          expect(block_kinds).to include("question")
          expect(block_kinds).to include("poll")
        end
      end

      context "when question participant has responded" do
        let!(:question_submission) do
          create(
            :experience_question_submission,
            experience_block: mad_lib.children.find_by(
              kind: ExperienceBlock::QUESTION
            ),
            user: question_participant.user,
            answer: { "value" => "Ruby" }
          )
        end

        before do
          broadcast_calls.clear
          subject
        end

        it "sends poll block to question participant after responding" do
          message = broadcast_call_for(
            broadcast_calls,
            question_participant
          )
          blocks = message[:message][:experience][:blocks]

          expect(blocks.size).to eq(1)
          expect(blocks.first[:kind]).to eq("poll")
        end
      end

      context "when all dependencies are resolved" do
        let(:question_block) do
          mad_lib.children.find_by(kind: ExperienceBlock::QUESTION)
        end

        let(:poll_block) do
          mad_lib.children.find_by(kind: ExperienceBlock::POLL)
        end

        let!(:question_submission) do
          create(
            :experience_question_submission,
            experience_block: question_block,
            user: question_participant.user,
            answer: { "value" => "Ruby" }
          )
        end

        let!(:poll_submission_from_question_participant) do
          create(
            :experience_poll_submission,
            experience_block: poll_block,
            user: question_participant.user,
            answer: { "selectedOptions" => ["coding"] }
          )
        end

        let!(:poll_submission_from_poll_participant) do
          create(
            :experience_poll_submission,
            experience_block: poll_block,
            user: poll_participant.user,
            answer: { "selectedOptions" => ["reading"] }
          )
        end

        before do
          broadcast_calls.clear
          subject
        end

        it "sends resolved mad lib to question participant" do
          message = broadcast_call_for(
            broadcast_calls,
            question_participant
          )
          blocks = message[:message][:experience][:blocks]

          expect(blocks.size).to eq(1)
          expect(blocks.first[:kind]).to eq("mad_lib")
        end

        it "sends resolved mad lib to poll participant" do
          message = broadcast_call_for(
            broadcast_calls,
            poll_participant
          )
          blocks = message[:message][:experience][:blocks]

          expect(blocks.size).to eq(1)
          expect(blocks.first[:kind]).to eq("mad_lib")
        end

        it "sends all blocks to host participant" do
          message = broadcast_call_for(
            broadcast_calls,
            host_participant
          )
          blocks = message[:message][:experience][:blocks]

          expect(blocks.size).to eq(3)
          block_kinds = blocks.map { |b| b[:kind] }
          expect(block_kinds).to include("mad_lib")
          expect(block_kinds).to include("question")
          expect(block_kinds).to include("poll")
        end
      end
    end

    context "with multiple simple blocks" do
      let!(:participant) do
        create(:experience_participant, experience: experience)
      end

      let!(:first_block) do
        create(
          :experience_block,
          experience: experience,
          status: :open,
          created_at: 2.minutes.ago
        )
      end

      let!(:second_block) do
        create(
          :experience_block,
          experience: experience,
          status: :open,
          created_at: 1.minute.ago
        )
      end

      before { subject }

      it "sends only the most recent block to participant" do
        message = broadcast_call_for(broadcast_calls, participant)
        blocks = message[:message][:experience][:blocks]

        expect(blocks.size).to eq(1)
        expect(blocks.first[:id]).to eq(second_block.id)
      end
    end
  end

  describe "ActionCable integration" do
    let!(:participant) do
      create(:experience_participant, experience: experience)
    end

    before do
      allow(broadcaster).to receive(:send_broadcast).and_call_original
    end

    it "calls ActionCable.server.broadcast when broadcasting" do
      expect(ActionCable.server).to receive(:broadcast).at_least(:once)
      broadcaster.broadcast_experience_update
    end
  end

  describe ".trigger_resubscription_for_participant" do
    let!(:participant) do
      create(:experience_participant, experience: experience)
    end

    it "broadcasts resubscription message to participant stream" do
      expect(ActionCable.server).to receive(:broadcast).with(
        "experience_#{experience.id}_participant_#{participant.id}",
        hash_including(
          type: 'resubscribe_required',
          participant_id: participant.id,
          reason: 'segments_changed'
        )
      )

      described_class.trigger_resubscription_for_participant(participant)
    end
  end
end
