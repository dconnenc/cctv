require "rails_helper"

RSpec.describe Experiences::Orchestrator, "minigame arithmetic" do
  let(:experience) { create(:experience, status: :live) }
  let(:host_user)  { create(:user) }
  let!(:host)      { create(:experience_participant, :host, user: host_user, experience: experience) }
  let!(:player)    { create(:experience_participant, :audience, experience: experience) }

  subject(:orchestrator) { described_class.new(actor: host_user, experience: experience) }

  describe "#add_block! for minigame_arithmetic" do
    it "generates the questions and zeros the timestamps on creation" do
      block = orchestrator.add_block!(
        kind: ExperienceBlock::MINIGAME_ARITHMETIC,
        payload: {
          "duration_seconds" => 30,
          "question_count"   => 5,
          "leaderboard_size" => 3
        }
      )

      expect(block.payload["variant"]).to eq("arithmetic")
      expect(block.payload["questions"].size).to eq(5)
      expect(block.payload["started_at"]).to be_nil
      expect(block.payload["ended_at"]).to be_nil
    end

    it "raises when duration or question count is missing" do
      expect {
        orchestrator.add_block!(kind: ExperienceBlock::MINIGAME_ARITHMETIC, payload: {})
      }.to raise_error(ArgumentError)
    end
  end

  describe "#start_minigame_arithmetic!" do
    let(:block) do
      orchestrator.add_block!(
        kind: ExperienceBlock::MINIGAME_ARITHMETIC,
        payload: {
          "duration_seconds" => 30,
          "question_count"   => 5,
          "leaderboard_size" => 3
        }
      )
    end

    it "sets started_at, opens the block, and schedules the end job" do
      expect {
        orchestrator.start_minigame_arithmetic!(block_id: block.id)
      }.to have_enqueued_job(Minigames::EndArithmeticJob).with(block.id, kind_of(String))

      block.reload
      expect(block.payload["started_at"]).to be_present
      expect(block.payload["ended_at"]).to be_nil
      expect(block.status).to eq("open")
    end
  end

  describe "#submit_minigame_arithmetic_response!" do
    let(:block) do
      orchestrator.add_block!(
        kind: ExperienceBlock::MINIGAME_ARITHMETIC,
        payload: {
          "duration_seconds" => 30,
          "question_count"   => 3,
          "leaderboard_size" => 5
        }
      )
    end

    let(:player_orchestrator) do
      described_class.new(actor: player.user, experience: experience)
    end

    before do
      orchestrator.start_minigame_arithmetic!(block_id: block.id)
    end

    it "records correct answers" do
      block.reload
      first = block.payload["questions"].first

      submission = player_orchestrator.submit_minigame_arithmetic_response!(
        block_id:       block.id,
        question_index: 0,
        answer:         first["answer"].to_s
      )

      expect(submission.correct).to be(true)
      expect(submission.question_index).to eq(0)
    end

    it "records wrong answers without telling the user" do
      submission = player_orchestrator.submit_minigame_arithmetic_response!(
        block_id:       block.id,
        question_index: 0,
        answer:         "-9999"
      )

      expect(submission.correct).to be(false)
    end

    it "treats blank answers as wrong but advances the player" do
      submission = player_orchestrator.submit_minigame_arithmetic_response!(
        block_id:       block.id,
        question_index: 0,
        answer:         ""
      )

      expect(submission.correct).to be(false)
      expect(submission.submitted_answer).to eq("")
    end

    it "is idempotent per question index for a single player" do
      player_orchestrator.submit_minigame_arithmetic_response!(
        block_id: block.id, question_index: 0, answer: "1"
      )

      expect {
        player_orchestrator.submit_minigame_arithmetic_response!(
          block_id: block.id, question_index: 0, answer: "999"
        )
      }.not_to change { ExperienceMinigameSubmission.where(experience_block_id: block.id, user_id: player.user_id).count }
    end

    it "rejects submissions before start" do
      block.reload
      block.update!(payload: block.payload.merge("started_at" => nil))

      expect {
        player_orchestrator.submit_minigame_arithmetic_response!(
          block_id: block.id, question_index: 0, answer: "1"
        )
      }.to raise_error(Experiences::InvalidTransitionError)
    end

    it "rejects submissions after end" do
      orchestrator.end_minigame_arithmetic!(block_id: block.id)

      expect {
        player_orchestrator.submit_minigame_arithmetic_response!(
          block_id: block.id, question_index: 0, answer: "1"
        )
      }.to raise_error(Experiences::InvalidTransitionError)
    end
  end

  describe "#end_minigame_arithmetic!" do
    let(:block) do
      orchestrator.add_block!(
        kind: ExperienceBlock::MINIGAME_ARITHMETIC,
        payload: {
          "duration_seconds" => 30,
          "question_count"   => 3,
          "leaderboard_size" => 5
        }
      )
    end

    before do
      orchestrator.start_minigame_arithmetic!(block_id: block.id)
    end

    it "stamps ended_at and closes the block" do
      orchestrator.end_minigame_arithmetic!(block_id: block.id)
      block.reload
      expect(block.payload["ended_at"]).to be_present
      expect(block.status).to eq("closed")
    end

    it "is idempotent" do
      orchestrator.end_minigame_arithmetic!(block_id: block.id)
      first_ended_at = block.reload.payload["ended_at"]

      orchestrator.end_minigame_arithmetic!(block_id: block.id)
      expect(block.reload.payload["ended_at"]).to eq(first_ended_at)
    end
  end
end
