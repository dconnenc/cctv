require "rails_helper"

RSpec.describe ExperienceCollaborativeDrawingAssignment do
  describe ".grid_region" do
    def region(index, count)
      described_class.grid_region(slice_index: index, slice_count: count)
    end

    it "splits two slices into top and bottom halves" do
      expect(region(0, 2)).to eq("x" => 0.0, "y" => 0.0, "w" => 1.0, "h" => 0.5)
      expect(region(1, 2)).to eq("x" => 0.0, "y" => 0.5, "w" => 1.0, "h" => 0.5)
    end

    it "puts one slice on top and two below for three" do
      expect(region(0, 3)).to eq("x" => 0.0, "y" => 0.0, "w" => 1.0, "h" => 0.5)
      expect(region(1, 3)).to eq("x" => 0.0, "y" => 0.5, "w" => 0.5, "h" => 0.5)
      expect(region(2, 3)).to eq("x" => 0.5, "y" => 0.5, "w" => 0.5, "h" => 0.5)
    end

    it "lays four slices out as a 2x2 grid" do
      expect(region(0, 4)).to eq("x" => 0.0, "y" => 0.0, "w" => 0.5, "h" => 0.5)
      expect(region(3, 4)).to eq("x" => 0.5, "y" => 0.5, "w" => 0.5, "h" => 0.5)
    end

    it "tiles regions so their areas cover the whole photo" do
      (1..9).each do |count|
        total = (0...count).sum { |i| r = region(i, count); r["w"] * r["h"] }
        expect(total).to be_within(1e-3).of(1.0)
      end
    end
  end
end
