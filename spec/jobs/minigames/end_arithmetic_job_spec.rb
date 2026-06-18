require "rails_helper"

RSpec.describe Minigames::EndArithmeticJob do
  let(:experience)   { create(:experience, status: :live) }
  let(:host_user)    { create(:user) }
  let!(:host)        { create(:experience_participant, :host, user: host_user, experience: experience) }
  let(:orchestrator) { Experiences::Orchestrator.new(actor: host_user, experience: experience) }

  let(:block) do
    orchestrator.add_block!(
      kind: ExperienceBlock::MINIGAME_ARITHMETIC,
      payload: { "duration_seconds" => 30, "question_count" => 3, "leaderboard_size" => 5 }
    )
  end

  before do
    orchestrator.start_minigame_arithmetic!(block: block)
  end

  def current_started_at
    block.reload.payload["started_at"]
  end

  it "ends the round but keeps the block open so the leaderboard stays on the monitor" do
    described_class.perform_now(block.id, current_started_at)

    block.reload
    expect(block.payload["ended_at"]).to be_present
    expect(block.status).to eq("open")
  end

  it "broadcasts the update so the leaderboard appears" do
    expect {
      described_class.perform_now(block.id, current_started_at)
    }.to have_enqueued_job(Experiences::BroadcastUpdateJob).with(experience.id)
  end

  it "does nothing when the round was already ended" do
    orchestrator.end_minigame_arithmetic!(block: block)
    first_ended_at = block.reload.payload["ended_at"]

    described_class.perform_now(block.id, current_started_at)

    expect(block.reload.payload["ended_at"]).to eq(first_ended_at)
  end

  it "does nothing when the started_at stamp no longer matches a restarted round" do
    described_class.perform_now(block.id, "2000-01-01T00:00:00Z")

    expect(block.reload.payload["ended_at"]).to be_nil
  end
end
