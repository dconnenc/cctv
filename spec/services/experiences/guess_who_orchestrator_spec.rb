require "rails_helper"

RSpec.describe Experiences::Orchestrator do
  let(:experience) { create(:experience, status: :live) }
  let(:host_user) { create(:user, :user) }

  let!(:host_participant) do
    create(:experience_participant, :host, user: host_user, experience: experience)
  end

  let!(:contestant_a) { create(:experience_participant, :audience, experience: experience) }
  let!(:contestant_b) { create(:experience_participant, :audience, experience: experience) }
  let!(:audience_c) { create(:experience_participant, :audience, experience: experience) }
  let!(:audience_d) { create(:experience_participant, :audience, experience: experience) }
  let!(:audience_e) { create(:experience_participant, :audience, experience: experience) }

  let(:pool_segment) do
    seg = create_segment("audience-pool")
    [contestant_a, contestant_b, audience_c, audience_d, audience_e].each do |p|
      ExperienceParticipantSegment.create!(experience_participant: p, experience_segment: seg)
    end
    seg
  end

  let(:contestant_segment) do
    seg = create_segment("contestants")
    [contestant_a, contestant_b].each do |p|
      ExperienceParticipantSegment.create!(experience_participant: p, experience_segment: seg)
    end
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
    [contestant_a, contestant_b, audience_c, audience_d, audience_e].each do |p|
      create(:experience_question_submission,
        experience_block: question_block,
        experience_participant: p,
        answer: { "value" => "blue-#{p.id[0..3]}" }
      )
    end
  end

  subject(:orchestrator) { described_class.new(actor: host_user, experience: experience) }

  let(:guess_who_block) do
    create(:experience_block,
      experience: experience,
      kind: ExperienceBlock::GUESS_WHO,
      payload: {
        "segment_id" => pool_segment.id,
        "contestant_segment_id" => contestant_segment.id,
        "eligibility_threshold" => 0.10,
        "monitor_view" => "idle",
        "revealed" => false,
        "started" => false,
        "contestants" => [],
        "active_poll_block_id" => nil,
        "active_poll_contestant_index" => nil
      },
      position: 1
    )
  end

  describe "#start_guess_who!" do
    it "picks two mystery participants and snapshots their clues" do
      orchestrator.start_guess_who!(block: guess_who_block)
      payload = guess_who_block.reload.payload

      expect(payload["started"]).to eq(true)
      expect(payload["contestants"].length).to eq(2)

      mystery_ids = payload["contestants"].map { |c| c["mystery_user_id"] }
      contestant_ids = payload["contestants"].map { |c| c["contestant_user_id"] }

      expect(contestant_ids).to contain_exactly(contestant_a.user_id, contestant_b.user_id)
      expect(mystery_ids.uniq.length).to eq(2)
      expect(mystery_ids).not_to include(contestant_a.user_id, contestant_b.user_id)

      payload["contestants"].each do |c|
        expect(c["clues"]).to be_an(Array)
        expect(c["clues"]).not_to be_empty
        expect(c["board_candidate_ids"]).to be_an(Array)
        expect(c["board_candidate_ids"]).not_to include(c["contestant_user_id"])
      end
    end

    it "raises when contestant segment does not have exactly 2 members" do
      ExperienceParticipantSegment.where(experience_segment_id: contestant_segment.id).delete_all

      expect {
        orchestrator.start_guess_who!(block: guess_who_block)
      }.to raise_error(Experiences::InvalidTransitionError)
    end
  end

  describe "#reroll_guess_who_mystery!" do
    before { orchestrator.start_guess_who!(block: guess_who_block) }

    it "replaces the mystery for the given contestant index" do
      original = guess_who_block.reload.payload["contestants"][0]["mystery_user_id"]
      attempts = 0
      while attempts < 10
        orchestrator.reroll_guess_who_mystery!(block: guess_who_block, contestant_index: 0)
        new_value = guess_who_block.reload.payload["contestants"][0]["mystery_user_id"]
        break if new_value != original
        attempts += 1
      end

      expect(guess_who_block.reload.payload["contestants"][0]["mystery_user_id"]).not_to eq(contestant_a.user_id)
    end
  end

  describe "#set_guess_who_monitor_view!" do
    before { orchestrator.start_guess_who!(block: guess_who_block) }

    it "updates monitor_view when given a valid value" do
      orchestrator.set_guess_who_monitor_view!(block: guess_who_block, view: "c1_board")
      expect(guess_who_block.reload.payload["monitor_view"]).to eq("c1_board")
    end

    it "rejects invalid values" do
      expect {
        orchestrator.set_guess_who_monitor_view!(block: guess_who_block, view: "bogus")
      }.to raise_error(ArgumentError)
    end
  end

  describe "#dispatch_guess_who_poll! and #conclude_guess_who_poll!" do
    before { orchestrator.start_guess_who!(block: guess_who_block) }

    it "creates a child True/False poll block and tracks it as active" do
      orchestrator.dispatch_guess_who_poll!(block: guess_who_block, contestant_index: 0)
      payload = guess_who_block.reload.payload

      expect(payload["active_poll_block_id"]).to be_present
      expect(payload["active_poll_contestant_index"]).to eq(0)

      poll = ExperienceBlock.find(payload["active_poll_block_id"])
      expect(poll.kind).to eq(ExperienceBlock::POLL)
      expect(poll.payload["options"]).to eq(["True", "False"])
      expect(poll.parent_block_id).to eq(guess_who_block.id)
    end

    it "refuses to dispatch when one is already active" do
      orchestrator.dispatch_guess_who_poll!(block: guess_who_block, contestant_index: 0)

      expect {
        orchestrator.dispatch_guess_who_poll!(block: guess_who_block, contestant_index: 1)
      }.to raise_error(Experiences::InvalidTransitionError)
    end

    it "eliminates candidates whose answer differs from the mystery participant's" do
      orchestrator.dispatch_guess_who_poll!(block: guess_who_block, contestant_index: 0)
      payload = guess_who_block.reload.payload
      poll_id = payload["active_poll_block_id"]
      mystery_user_id = payload["contestants"][0]["mystery_user_id"]
      candidates = payload["contestants"][0]["board_candidate_ids"]

      participants_by_user_id = experience.experience_participants
        .where(user_id: [mystery_user_id] + candidates)
        .index_by(&:user_id)

      ExperiencePollSubmission.create!(
        experience_block_id: poll_id,
        experience_participant: participants_by_user_id[mystery_user_id],
        answer: { "selectedOptions" => ["True"] }
      )

      matched = candidates.first
      differed = candidates.last
      ExperiencePollSubmission.create!(
        experience_block_id: poll_id,
        experience_participant: participants_by_user_id[matched],
        answer: { "selectedOptions" => ["True"] }
      )
      ExperiencePollSubmission.create!(
        experience_block_id: poll_id,
        experience_participant: participants_by_user_id[differed],
        answer: { "selectedOptions" => ["False"] }
      )

      orchestrator.conclude_guess_who_poll!(block: guess_who_block)
      contestant = guess_who_block.reload.payload["contestants"][0]

      expect(contestant["eliminated_user_ids"]).to include(differed)
      expect(contestant["eliminated_user_ids"]).not_to include(matched)
      missing_responders = candidates - [matched, differed]
      expect(contestant["unanswered_user_ids"]).to match_array(missing_responders)
    end
  end

  describe "#reveal_guess_who!" do
    before { orchestrator.start_guess_who!(block: guess_who_block) }

    it "marks the game as revealed and switches monitor to reveal" do
      orchestrator.reveal_guess_who!(block: guess_who_block)
      payload = guess_who_block.reload.payload

      expect(payload["revealed"]).to eq(true)
      expect(payload["monitor_view"]).to eq("reveal")
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
