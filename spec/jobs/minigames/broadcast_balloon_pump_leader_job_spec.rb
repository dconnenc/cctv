require "rails_helper"

RSpec.describe Minigames::BroadcastBalloonPumpLeaderJob do
  let(:experience) { create(:experience, status: :live) }
  let(:host_user)  { create(:user) }
  let!(:host)      { create(:experience_participant, :host, user: host_user, experience: experience) }
  let(:orchestrator) { Experiences::Orchestrator.new(actor: host_user, experience: experience) }

  let(:block) do
    orchestrator.add_block!(
      kind: ExperienceBlock::MINIGAME_BALLOON_PUMP,
      payload: { "target_units" => 40 }
    )
  end

  let(:broadcast_calls) { [] }
  let(:admin_stream_key) { Experiences::Broadcaster.admin_stream_key(experience) }

  before do
    allow(ActionCable.server).to receive(:broadcast) do |stream_key, message|
      broadcast_calls << { stream_key: stream_key, message: message }
    end
  end

  context "when the game is running" do
    before do
      orchestrator.start_minigame_balloon_pump!(block: block)
      ExperienceBlock.where(id: block.id).update_all(
        "payload = payload || '{\"leader_fill\": 20, \"leader_participant_id\": \"42\"}'::jsonb"
      )
    end

    it "broadcasts a minigame_balloon_pump_leader_updated message to the admin stream" do
      described_class.perform_now(block.id)

      call = broadcast_calls.find do |c|
        c[:stream_key] == admin_stream_key &&
          c[:message][:type] == "minigame_balloon_pump_leader_updated"
      end
      expect(call).to be_present
      expect(call[:message][:block_id]).to eq(block.id)
      expect(call[:message][:leader_fill]).to eq(20)
    end
  end

  context "when the game has not started" do
    it "does not broadcast" do
      described_class.perform_now(block.id)

      leader_broadcasts = broadcast_calls.select do |c|
        c[:message][:type] == "minigame_balloon_pump_leader_updated"
      end
      expect(leader_broadcasts).to be_empty
    end
  end

  context "when the game has ended" do
    before do
      orchestrator.start_minigame_balloon_pump!(block: block)
      orchestrator.end_minigame_balloon_pump!(block: block)
    end

    it "does not broadcast" do
      described_class.perform_now(block.id)

      leader_broadcasts = broadcast_calls.select do |c|
        c[:message][:type] == "minigame_balloon_pump_leader_updated"
      end
      expect(leader_broadcasts).to be_empty
    end
  end

  context "when the block does not exist" do
    it "does not raise and does not broadcast" do
      expect { described_class.perform_now(-1) }.not_to raise_error

      expect(broadcast_calls).to be_empty
    end
  end
end
