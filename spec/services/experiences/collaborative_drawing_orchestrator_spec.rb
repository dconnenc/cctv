require "rails_helper"

RSpec.describe Experiences::Orchestrator, "collaborative drawing" do
  let(:experience) { create(:experience, status: :live) }
  let(:host_user)  { create(:user) }
  let!(:host)      { create(:experience_participant, :host, user: host_user, experience: experience) }
  let!(:player_a)  { create(:experience_participant, :audience, experience: experience, name: "Alice") }
  let!(:player_b)  { create(:experience_participant, :audience, experience: experience, name: "Bob") }

  subject(:orchestrator) { described_class.new(actor: host_user, experience: experience) }

  def base_payload(overrides = {})
    {
      "prompt" => "Draw your pet",
      "min_subsections" => 1,
      "max_subsections" => 4,
      "drawing_time_seconds" => 30,
      "total_drawings" => 1
    }.merge(overrides)
  end

  def create_block(overrides = {})
    orchestrator.add_block!(kind: ExperienceBlock::COLLABORATIVE_DRAWING, payload: base_payload(overrides))
  end

  def attach_photo(block, participant)
    photo = ExperienceCollaborativeDrawingPhoto.new(
      experience_block: block, experience_participant: participant
    )
    photo.save!(validate: false)
    photo.photo.attach(io: StringIO.new("img"), filename: "p.png", content_type: "image/png")
    photo
  end

  describe "#add_block!" do
    it "seeds config and starts in the intake phase" do
      block = create_block

      expect(block.payload["phase"]).to eq("intake")
      expect(block.payload["pool"]).to eq([])
      expect(block.payload["round_started_at"]).to be_nil
    end

    it "raises when the subsection range is inverted" do
      expect {
        create_block("min_subsections" => 5, "max_subsections" => 2)
      }.to raise_error(ArgumentError)
    end
  end

  describe "#start_collaborative_drawing_round!" do
    it "assigns each drawer a (group, slice) slot and opens the round" do
      block = create_block("total_drawings" => 1, "min_subsections" => 2, "max_subsections" => 4)
      attach_photo(block, player_a)

      orchestrator.start_collaborative_drawing_round!(block: block)
      block.reload

      expect(block.payload["phase"]).to eq("round")
      expect(block.status).to eq("open")
      expect(block.payload["pool"].length).to eq(1)
      # ceil(2 drawers / 1 photo) = 2, clamped into [2, 4] => 2 slices.
      expect(block.payload["subsection_count"]).to eq(2)

      assignments = block.experience_collaborative_drawing_assignments
      expect(assignments.count).to eq(2)
      expect(assignments.map(&:experience_participant_id)).to contain_exactly(player_a.id, player_b.id)
      expect(assignments.map(&:slice_index)).to contain_exactly(0, 1)
    end

    it "excludes hosts and moderators from the drawers" do
      block = create_block
      attach_photo(block, player_a)

      orchestrator.start_collaborative_drawing_round!(block: block)

      drawer_ids = block.experience_collaborative_drawing_assignments.map(&:experience_participant_id)
      expect(drawer_ids).not_to include(host.id)
    end

    it "raises when no photos were submitted" do
      block = create_block
      expect {
        orchestrator.start_collaborative_drawing_round!(block: block)
      }.to raise_error(ArgumentError)
    end
  end

  describe "#submit_collaborative_drawing!" do
    let(:block) { create_block }

    before do
      attach_photo(block, player_a)
      orchestrator.start_collaborative_drawing_round!(block: block)
    end

    it "stores the flattened image and stamps submitted_at" do
      drawer = described_class.new(actor: player_a.user, experience: experience)
      drawer.submit_collaborative_drawing!(block: block, image: "data:image/png;base64,AAAA")

      assignment = block.experience_collaborative_drawing_assignments.find_by(experience_participant: player_a)
      expect(assignment.drawing_image).to eq("data:image/png;base64,AAAA")
      expect(assignment.submitted_at).to be_present
    end

    it "returns nil for a participant with no assignment" do
      outsider = create(:experience_participant, :audience, experience: experience)
      result = described_class.new(actor: outsider.user, experience: experience)
        .submit_collaborative_drawing!(block: block, image: "x")
      expect(result).to be_nil
    end
  end

  describe "#end_collaborative_drawing_round! composites" do
    let(:block) { create_block("total_drawings" => 1, "min_subsections" => 2, "max_subsections" => 2) }

    before do
      attach_photo(block, player_a)
      orchestrator.start_collaborative_drawing_round!(block: block)
      described_class.new(actor: player_a.user, experience: experience)
        .submit_collaborative_drawing!(block: block, image: "data:image/png;base64,ALICE")
    end

    it "stacks each group's slices in order, carrying submitted images" do
      orchestrator.end_collaborative_drawing_round!(block: block)
      composite = block.reload.payload["composites"].first

      expect(composite["group_index"]).to eq(0)
      expect(composite["slices"].map { |s| s["slice_index"] }).to eq([0, 1])
      images = composite["slices"].map { |s| s["image"] }
      expect(images).to include("data:image/png;base64,ALICE")
    end
  end

  describe "monitor board" do
    let(:block) { create_block("total_drawings" => 1, "min_subsections" => 1, "max_subsections" => 2) }

    before do
      attach_photo(block, player_a)
      orchestrator.start_collaborative_drawing_round!(block: block)
    end

    def monitor_board
      payload = Experiences::Visibility.new(experience).for_monitor[:blocks]
        .find { |b| b[:kind] == ExperienceBlock::COLLABORATIVE_DRAWING }[:payload]
      payload["board"]
    end

    it "groups drawers into teams by slice order and marks them ungrey once submitted" do
      board = monitor_board
      alice = board.flat_map { |g| g["slices"] }.find { |s| s["participant_id"] == player_a.id }

      expect(alice["name"]).to eq("Alice")
      expect(alice["submitted"]).to be(false)

      described_class.new(actor: player_a.user, experience: experience)
        .submit_collaborative_drawing!(block: block, image: "data:image/png;base64,ALICE")

      refreshed = monitor_board.flat_map { |g| g["slices"] }.find { |s| s["participant_id"] == player_a.id }
      expect(refreshed["submitted"]).to be(true)
    end

    it "is absent from the participant payload (avatars stay off shared profile streams by default)" do
      participant_payload = Experiences::Visibility.new(experience)
        .for_participant(player_b)[:blocks]
        .find { |b| b[:kind] == ExperienceBlock::COLLABORATIVE_DRAWING }
      expect(participant_payload[:payload]).not_to have_key("board")
    end
  end
end
