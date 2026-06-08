require "rails_helper"

RSpec.describe ChicagoTheater do
  describe ".match" do
    it "matches an exact name case-insensitively" do
      expect(described_class.match("the second city")&.slug).to eq("second-city")
    end

    it "matches an alias ignoring punctuation and spacing" do
      expect(described_class.match("Den Theater")&.slug).to eq("the-den")
      expect(described_class.match("i.O.")&.slug).to eq("io-theater")
    end

    it "returns nil for unknown venues" do
      expect(described_class.match("Some Random Bar")).to be_nil
    end

    it "returns nil for blank input" do
      expect(described_class.match(nil)).to be_nil
      expect(described_class.match("   ")).to be_nil
    end
  end

  describe ".find" do
    it "looks up a theater by slug" do
      expect(described_class.find("the-hideout")&.name).to eq("The Hideout")
    end
  end

  describe "#as_json" do
    it "exposes coordinates and omits aliases" do
      theater = described_class.all.first
      expect(theater.as_json.keys).to contain_exactly(:slug, :name, :neighborhood, :lat, :lng)
    end
  end
end
