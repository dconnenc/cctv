require "rails_helper"

RSpec.describe TheSceneAdvanceAfterRevealJob do
  let(:creator) { create(:user) }
  let(:experience) { create(:experience, status: :live, creator: creator) }
  let!(:host) { create(:experience_participant, :host, user: creator, experience: experience) }
  let!(:player_a) { create(:experience_participant, :audience, experience: experience) }
  let!(:player_b) { create(:experience_participant, :audience, experience: experience) }
  let!(:player_c) { create(:experience_participant, :audience, experience: experience) }
  let!(:player_d) { create(:experience_participant, :audience, experience: experience) }
  let!(:player_e) { create(:experience_participant, :audience, experience: experience) }

  let(:orchestrator) { Experiences::Orchestrator.new(experience: experience, actor: creator) }

  let(:block) do
    orchestrator.add_block!(
      kind: ExperienceBlock::THE_SCENE,
      payload: { "leaderboard_size" => 5, "prompt_input_count" => 2 }
    )
  end

  def setup_winner_reveal
    orchestrator.start_the_scene!(block: block)
    prompts = block.reload.payload["prompt_participant_ids"]
    r_a = experience.experience_participants.find(prompts[0])
    r_b = experience.experience_participants.find(prompts[1])
    Experiences::Orchestrator.new(experience: experience, actor: r_a.user).submit_the_scene_suggestion!(block: block, text: "a")
    Experiences::Orchestrator.new(experience: experience, actor: r_b.user).submit_the_scene_suggestion!(block: block, text: "b")
    buzzer = experience.experience_participants.find(block.reload.payload["buzzer_participant_id"])
    Experiences::Orchestrator.new(experience: experience, actor: buzzer.user).press_the_scene_buzzer!(block: block)
    block.reload
  end

  it "advances to the next scene and broadcasts when scene_started_at matches" do
    setup_winner_reveal
    scene_stamp = block.payload["scene_started_at"]

    expect_any_instance_of(Experiences::Broadcaster).to receive(:broadcast_experience_update)
    described_class.perform_now(block.id, scene_stamp)

    payload = block.reload.payload
    expect(payload["phase"]).to eq("collecting")
    expect(payload["scene_started_at"]).not_to eq(scene_stamp)
    expect(payload["winner_revealed_at"]).to be_nil
  end

  it "is a no-op when scene_started_at has already changed" do
    setup_winner_reveal
    stale_stamp = "1999-01-01T00:00:00.000000Z"

    expect_any_instance_of(Experiences::Broadcaster).not_to receive(:broadcast_experience_update)
    described_class.perform_now(block.id, stale_stamp)

    expect(block.reload.payload["phase"]).to eq("winner_reveal")
  end

  it "is a no-op when phase has already left winner_reveal" do
    setup_winner_reveal
    scene_stamp = block.payload["scene_started_at"]

    orchestrator.start_next_scene!(block: block)

    expect_any_instance_of(Experiences::Broadcaster).not_to receive(:broadcast_experience_update)
    described_class.perform_now(block.id, scene_stamp)
  end

  it "discards on missing block" do
    expect {
      described_class.perform_now("00000000-0000-0000-0000-000000000000", "x")
    }.not_to raise_error
  end
end
