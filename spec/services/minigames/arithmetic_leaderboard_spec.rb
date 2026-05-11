require "rails_helper"

RSpec.describe Minigames::ArithmeticLeaderboard do
  let(:experience) { create(:experience, status: :live) }
  let(:host) { create(:experience_participant, :host, experience: experience) }
  let(:player_a) { create(:experience_participant, :audience, experience: experience) }
  let(:player_b) { create(:experience_participant, :audience, experience: experience) }
  let(:player_c) { create(:experience_participant, :audience, experience: experience) }

  let(:block) do
    create(
      :experience_block,
      experience: experience,
      kind: ExperienceBlock::MINIGAME_ARITHMETIC,
      payload: {
        "variant" => "arithmetic",
        "duration_seconds" => 60,
        "question_count" => 5,
        "leaderboard_size" => 5,
        "questions" => [],
        "started_at" => Time.current.iso8601,
        "ended_at" => (Time.current + 1.minute).iso8601
      }
    )
  end

  before do
    submit(player_a, 0, true,  Time.current)
    submit(player_a, 1, true,  Time.current + 1.second)
    submit(player_a, 2, false, Time.current + 2.seconds)

    submit(player_b, 0, true,  Time.current)
    submit(player_b, 1, true,  Time.current + 1.second)

    submit(player_c, 0, false, Time.current)
  end

  it "ranks players by correct answers descending" do
    result = described_class.compute(block: block)
    expect(result.map { |r| r["participant_id"] }).to eq([player_a.id, player_b.id, player_c.id])
  end

  it "exposes correct/completed counts and rank" do
    result = described_class.compute(block: block)

    a, b, c = result
    expect(a.slice("correct", "completed", "rank")).to eq("correct" => 2, "completed" => 3, "rank" => 1)
    expect(b.slice("correct", "completed", "rank")).to eq("correct" => 2, "completed" => 2, "rank" => 1)
    expect(c.slice("correct", "completed", "rank")).to eq("correct" => 0, "completed" => 1, "rank" => 3)
  end

  it "shares a rank between ties" do
    result = described_class.compute(block: block)
    expect(result.map { |r| r["rank"] }).to eq([1, 1, 3])
  end

  def submit(participant, index, correct, at)
    ExperienceMinigameSubmission.create!(
      experience_block_id: block.id,
      user_id: participant.user_id,
      question_index: index,
      submitted_answer: correct ? "1" : "x",
      correct: correct,
      submitted_at: at
    )
  end
end
