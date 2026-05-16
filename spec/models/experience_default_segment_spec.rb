require 'rails_helper'

RSpec.describe Experience, "default segment" do
  let(:creator) { create(:user) }
  let(:experience) { create(:experience, creator: creator) }
  let(:user) { create(:user) }

  describe "#ensure_default_segment!" do
    it "creates an Audience segment when none is configured" do
      expect {
        experience.ensure_default_segment!
      }.to change { experience.experience_segments.count }.by(1)

      experience.reload
      expect(experience.default_segment.name).to eq("Audience")
    end

    it "honors a custom name on first call" do
      experience.ensure_default_segment!(name: "Crowd")
      expect(experience.reload.default_segment.name).to eq("Crowd")
    end

    it "is idempotent — repeated calls return the same segment" do
      first  = experience.ensure_default_segment!
      second = experience.ensure_default_segment!
      expect(first.id).to eq(second.id)
      expect(experience.experience_segments.count).to eq(1)
    end

    it "re-seeds when the default segment was deleted" do
      seg = experience.ensure_default_segment!
      seg.destroy!
      experience.reload
      expect(experience.default_segment_id).to be_nil

      experience.ensure_default_segment!
      experience.reload
      expect(experience.default_segment).to be_present
      expect(experience.default_segment.name).to eq("Audience")
    end
  end

  describe "#register_user" do
    before { experience.ensure_default_segment! }

    it "auto-attaches new audience participants to the default segment" do
      experience.register_user(user, name: "Test")

      participant = experience.experience_participants.find_by(user_id: user.id)
      expect(participant.experience_segments).to include(experience.default_segment)
    end

    it "does not attach hosts/moderators" do
      participant = experience.experience_participants.create!(
        user: user, name: "Host", role: :host
      )

      experience.attach_default_segment(participant)
      expect(participant.reload.experience_segments).to be_empty
    end

    it "is a no-op for an already-attached participant" do
      experience.register_user(user, name: "Test")
      participant = experience.experience_participants.find_by(user_id: user.id)

      expect {
        experience.attach_default_segment(participant)
      }.not_to change { participant.experience_segments.count }
    end

    it "re-seeds the default segment if the host deleted it before another registration" do
      first_user  = create(:user)
      experience.register_user(first_user, name: "First")
      experience.default_segment.destroy!
      experience.reload

      second_user = create(:user)
      experience.register_user(second_user, name: "Second")

      experience.reload
      expect(experience.default_segment).to be_present

      participant = experience.experience_participants.find_by(user_id: second_user.id)
      expect(participant.experience_segments).to include(experience.default_segment)
    end

    it "rolls back the participant if segment attachment fails" do
      allow(experience).to receive(:attach_default_segment).and_raise(ActiveRecord::RecordInvalid)

      expect {
        expect { experience.register_user(user, name: "Test") }.to raise_error(ActiveRecord::RecordInvalid)
      }.not_to change { experience.experience_participants.count }
    end
  end

  describe "position assignment" do
    it "uses MAX(position)+1 so deleted segments don't cause collisions" do
      # Simulate a non-contiguous position sequence: positions 0 and 2 exist,
      # position 1 was previously deleted. `count` would produce 2 and collide
      # with the existing segment at position 2.
      experience.experience_segments.create!(name: "A", color: "#111111", position: 0)
      experience.experience_segments.create!(name: "B", color: "#222222", position: 2)

      segment = experience.ensure_default_segment!
      expect(segment.position).to eq(3)
    end
  end
end
