require "rails_helper"

RSpec.describe Experiences::BroadcastUpdateJob do
  let(:experience) { create(:experience) }
  let!(:participant) { create(:experience_participant, experience: experience) }
  let!(:block) { create(:experience_block, experience: experience, status: :open) }
  let(:broadcast_calls) { [] }

  before do
    allow(ActionCable.server).to receive(:broadcast) do |stream_key, message|
      broadcast_calls << { stream_key: stream_key, message: message }
    end
  end

  it "broadcasts to the profile stream, monitor stream, and admin stream" do
    described_class.perform_now(experience.id)

    stream_keys = broadcast_calls.map { |c| c[:stream_key] }
    fingerprint = Experiences::Broadcaster.visibility_fingerprint(experience, participant)

    expect(stream_keys).to include(
      Experiences::Broadcaster.profile_stream_key(experience, fingerprint),
      Experiences::Broadcaster.monitor_stream_key(experience),
      Experiences::Broadcaster.admin_stream_key(experience)
    )
  end

  it "includes the open block in the profile stream message" do
    described_class.perform_now(experience.id)

    fingerprint = Experiences::Broadcaster.visibility_fingerprint(experience, participant)
    profile_call = broadcast_calls.find do |c|
      c[:stream_key] == Experiences::Broadcaster.profile_stream_key(experience, fingerprint)
    end

    expect(profile_call[:message][:experience][:blocks].map { |b| b[:id] }).to include(block.id)
  end

  it "does not broadcast when the experience no longer exists" do
    described_class.perform_now(-1)

    expect(broadcast_calls).to be_empty
  end
end
