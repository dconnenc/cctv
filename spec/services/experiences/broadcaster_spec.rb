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
    fingerprint = Experiences::Broadcaster.visibility_fingerprint(
      participant.experience,
      participant
    )
    expected_key = Experiences::Broadcaster.profile_stream_key(participant.experience, fingerprint)
    calls.find { |call| call[:stream_key] == expected_key }
  end

  describe "#broadcast_experience_update" do
    subject { broadcaster.broadcast_experience_update }

    context "with no participants" do
      it "broadcasts to monitor and admin streams" do
        subject
        expect(broadcast_calls.size).to eq(2)
        expect(broadcast_calls.map { |c| c[:stream_key] }).to include(
          match(/monitor/),
          match(/admins/)
        )
      end
    end

    context "with participants and no blocks" do
      let!(:participant) do
        create(:experience_participant, experience: experience)
      end

      before { subject }

      it "broadcasts three messages (profile, monitor, admin)" do
        expect(broadcast_calls.size).to eq(3)
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

        it "sends mad_lib block with visible children to question participant" do
          message = broadcast_call_for(
            broadcast_calls,
            question_participant
          )
          blocks = message[:message][:experience][:blocks]

          expect(blocks.size).to eq(1)
          expect(blocks.first[:kind]).to eq("mad_lib")

          children = blocks.first[:children]
          expect(children).to be_present
          child_kinds = children.map { |c| c[:kind] }
          expect(child_kinds).to include("question")
          expect(child_kinds).to include("poll")
        end

        it "sends mad_lib block with visible children to poll participant" do
          message = broadcast_call_for(
            broadcast_calls,
            poll_participant
          )
          blocks = message[:message][:experience][:blocks]

          expect(blocks.size).to eq(1)
          expect(blocks.first[:kind]).to eq("mad_lib")

          children = blocks.first[:children]
          expect(children).to be_present
          child_kinds = children.map { |c| c[:kind] }
          expect(child_kinds).to include("poll")
        end

        it "sends parent block with children embedded to host participant" do
          message = broadcast_call_for(
            broadcast_calls,
            host_participant
          )
          blocks = message[:message][:experience][:blocks]

          expect(blocks.size).to eq(1), "Host should receive only parent block"
          expect(blocks.first[:kind]).to eq("mad_lib")

          # Children should be embedded in the parent
          children = blocks.first[:children]
          expect(children).to be_present
          expect(children.size).to eq(2)

          child_kinds = children.map { |c| c[:kind] }
          expect(child_kinds).to include("question")
          expect(child_kinds).to include("poll")
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

        it "sends mad_lib block to question participant after responding" do
          message = broadcast_call_for(
            broadcast_calls,
            question_participant
          )
          blocks = message[:message][:experience][:blocks]

          expect(blocks.size).to eq(1)
          expect(blocks.first[:kind]).to eq("mad_lib")
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

        it "sends parent block with children embedded to host participant" do
          message = broadcast_call_for(
            broadcast_calls,
            host_participant
          )
          blocks = message[:message][:experience][:blocks]

          expect(blocks.size).to eq(1), "Host should receive only parent block"
          expect(blocks.first[:kind]).to eq("mad_lib")

          # Children should be embedded in the parent
          children = blocks.first[:children]
          expect(children).to be_present
          expect(children.size).to eq(2)

          child_kinds = children.map { |c| c[:kind] }
          expect(child_kinds).to include("question")
          expect(child_kinds).to include("poll")
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
          position: 0
        )
      end

      let!(:second_block) do
        create(
          :experience_block,
          experience: experience,
          status: :open,
          position: 1
        )
      end

      before { subject }

      it "sends the first block by position to participant" do
        message = broadcast_call_for(broadcast_calls, participant)
        blocks = message[:message][:experience][:blocks]

        expect(blocks.size).to eq(1)
        expect(blocks.first[:id]).to eq(first_block.id)
      end
    end
  end

  describe "profile_changes: resubscribe notifications" do
    let!(:participant) { create(:experience_participant, experience: experience) }
    let(:segment) { experience.experience_segments.create!(name: "Team A", color: "#FF0000", position: 0) }

    it "sends resubscribe_required to the old stream when a participant's fingerprint has changed" do
      old_fingerprint = described_class.visibility_fingerprint(experience, participant)
      participant.experience_segments << segment

      broadcaster.broadcast_experience_update(
        profile_changes: [{ participant: participant, old_fingerprint: old_fingerprint }]
      )

      old_stream = described_class.profile_stream_key(experience, old_fingerprint)
      resubscribe_call = broadcast_calls.find { |c| c[:stream_key] == old_stream }
      expect(resubscribe_call).to be_present
      expect(resubscribe_call[:message][:type]).to eq("resubscribe_required")
    end

    it "does not send resubscribe_required when the fingerprint is unchanged" do
      old_fingerprint = described_class.visibility_fingerprint(experience, participant)

      broadcaster.broadcast_experience_update(
        profile_changes: [{ participant: participant, old_fingerprint: old_fingerprint }]
      )

      old_stream = described_class.profile_stream_key(experience, old_fingerprint)
      resubscribe_call = broadcast_calls.find { |c|
        c[:stream_key] == old_stream && c[:message][:type] == "resubscribe_required"
      }
      expect(resubscribe_call).to be_nil
    end

    it "sends no resubscribe_required messages when profile_changes is empty" do
      broadcaster.broadcast_experience_update

      resubscribe_calls = broadcast_calls.select { |c| c[:message][:type] == "resubscribe_required" }
      expect(resubscribe_calls).to be_empty
    end
  end

end
