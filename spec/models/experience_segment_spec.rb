require "rails_helper"

RSpec.describe ExperienceSegment do
  let(:experience) { create(:experience) }

  describe "validations" do
    it "is valid with name, color, and position" do
      segment = experience.experience_segments.build(name: "Team A", color: "#FF0000", position: 0)
      expect(segment).to be_valid
    end

    it "requires name" do
      segment = experience.experience_segments.build(color: "#FF0000", position: 0)
      expect(segment).not_to be_valid
    end

    it "requires color" do
      segment = experience.experience_segments.build(name: "Team A", color: nil, position: 0)
      expect(segment).not_to be_valid
    end

    it "requires position" do
      segment = experience.experience_segments.build(name: "Team A", color: "#FF0000", position: nil)
      expect(segment).not_to be_valid
    end

    it "enforces unique name within experience" do
      experience.experience_segments.create!(name: "Team A", color: "#FF0000", position: 0)
      duplicate = experience.experience_segments.build(name: "Team A", color: "#0000FF", position: 1)
      expect(duplicate).not_to be_valid
    end

    it "allows the same name in different experiences" do
      other_experience = create(:experience)
      experience.experience_segments.create!(name: "Team A", color: "#FF0000", position: 0)
      segment = other_experience.experience_segments.build(name: "Team A", color: "#FF0000", position: 0)
      expect(segment).to be_valid
    end
  end

  describe "position uniqueness" do
    before do
      experience.experience_segments.create!(name: "Team A", color: "#FF0000", position: 0)
    end

    it "enforces unique position within experience" do
      duplicate = experience.experience_segments.build(name: "Team B", color: "#0000FF", position: 0)
      expect(duplicate).not_to be_valid
    end

    it "allows the same position in different experiences" do
      other_experience = create(:experience)
      expect {
        other_experience.experience_segments.create!(name: "Team A", color: "#FF0000", position: 0)
      }.not_to raise_error
    end
  end
end
