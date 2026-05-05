require "rails_helper"

RSpec.describe Experiences::Orchestrator do
  let(:experience) { create(:experience, status: :live) }
  let(:host_user) { create(:user, :user) }

  let!(:host_participant) do
    create(:experience_participant, :host, user: host_user, experience: experience)
  end

  let!(:audience_a) { create(:experience_participant, :audience, experience: experience) }
  let!(:audience_b) { create(:experience_participant, :audience, experience: experience) }
  let!(:audience_c) { create(:experience_participant, :audience, experience: experience) }

  let(:segment) do
    seg = create_segment("contestants")
    [audience_a, audience_b, audience_c].each do |p|
      ExperienceParticipantSegment.create!(experience_participant: p, experience_segment: seg)
    end
    ExperienceParticipantSegment.create!(experience_participant: host_participant, experience_segment: seg)
    seg
  end

  let(:question_block) do
    create(:experience_block,
      experience: experience,
      kind: ExperienceBlock::QUESTION,
      payload: { "question" => "Favorite color?" },
      position: 0
    )
  end

  before do
    [audience_a, audience_b, audience_c].each do |p|
      create(:experience_question_submission,
        experience_block: question_block,
        user: p.user,
        answer: { "value" => "blue-#{p.id[0..3]}" }
      )
    end
  end

  subject(:orchestrator) { described_class.new(actor: host_user, experience: experience) }

  describe "#start_guess_who!" do
    let(:guess_who_block) do
      create(:experience_block,
        experience: experience,
        kind: ExperienceBlock::GUESS_WHO,
        payload: { "segment_id" => segment.id },
        position: 1
      )
    end

    it "selects two random audience members from the segment and snapshots their slides" do
      orchestrator.start_guess_who!(guess_who_block)
      guess_who_block.reload

      payload = guess_who_block.payload
      expect(payload["user_a_id"]).to be_present
      expect(payload["user_b_id"]).to be_present
      expect(payload["user_a_id"]).not_to eq(payload["user_b_id"])
      expect(payload["slides"]).to be_an(Array)
      expect(payload["slides"]).not_to be_empty
      expect(payload["current_slide_index"]).to eq(0)
      expect(payload["revealed"]).to eq(false)
    end

    it "excludes hosts and moderators from the random pool" do
      orchestrator.start_guess_who!(guess_who_block)
      payload = guess_who_block.reload.payload

      audience_user_ids = [audience_a, audience_b, audience_c].map(&:user_id)
      expect(audience_user_ids).to include(payload["user_a_id"])
      expect(audience_user_ids).to include(payload["user_b_id"])
      expect(payload["user_a_id"]).not_to eq(host_user.id)
      expect(payload["user_b_id"]).not_to eq(host_user.id)
    end

    it "is idempotent — re-opening keeps the same selected users" do
      orchestrator.start_guess_who!(guess_who_block)
      first_a = guess_who_block.reload.payload["user_a_id"]
      first_b = guess_who_block.reload.payload["user_b_id"]

      orchestrator.start_guess_who!(guess_who_block)
      expect(guess_who_block.reload.payload["user_a_id"]).to eq(first_a)
      expect(guess_who_block.reload.payload["user_b_id"]).to eq(first_b)
    end

    it "alternates slides between the two selected users" do
      orchestrator.start_guess_who!(guess_who_block)
      slides = guess_who_block.reload.payload["slides"]
      slots = slides.map { |s| s["slot"] }

      expect(slots.first(2)).to contain_exactly("a", "b")
    end
  end

  describe "#next_guess_who_slide! / #previous_guess_who_slide!" do
    let(:guess_who_block) do
      create(:experience_block,
        experience: experience,
        kind: ExperienceBlock::GUESS_WHO,
        payload: {
          "segment_id" => segment.id,
          "slides" => [
            { "slot" => "a", "user_id" => "x" },
            { "slot" => "b", "user_id" => "y" },
            { "slot" => "a", "user_id" => "x" }
          ],
          "current_slide_index" => 0,
          "revealed" => false
        },
        position: 1
      )
    end

    it "advances the current slide index" do
      orchestrator.next_guess_who_slide!(block_id: guess_who_block.id)
      expect(guess_who_block.reload.payload["current_slide_index"]).to eq(1)
    end

    it "clamps at the final slide" do
      guess_who_block.update!(payload: guess_who_block.payload.merge("current_slide_index" => 2))
      orchestrator.next_guess_who_slide!(block_id: guess_who_block.id)
      expect(guess_who_block.reload.payload["current_slide_index"]).to eq(2)
    end

    it "clamps at zero when going backward" do
      orchestrator.previous_guess_who_slide!(block_id: guess_who_block.id)
      expect(guess_who_block.reload.payload["current_slide_index"]).to eq(0)
    end
  end

  describe "#reveal_guess_who!" do
    let(:guess_who_block) do
      create(:experience_block,
        experience: experience,
        kind: ExperienceBlock::GUESS_WHO,
        payload: { "segment_id" => segment.id, "revealed" => false },
        position: 1
      )
    end

    it "sets revealed to true" do
      orchestrator.reveal_guess_who!(block_id: guess_who_block.id)
      expect(guess_who_block.reload.payload["revealed"]).to eq(true)
    end
  end

  def create_segment(name)
    experience.experience_segments.create!(
      name: name,
      color: "#6B7280",
      position: experience.experience_segments.count
    )
  end
end
