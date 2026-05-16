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

  end

end
