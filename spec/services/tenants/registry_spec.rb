require "rails_helper"

RSpec.describe Tenants::Registry do
  def config(key)
    Tenants::Config.new(
      key: key,
      name: key,
      blocks: %w[poll],
      features: [],
      theme: { display_name: key, tagline: key, site_name: key, description: key },
    )
  end

  it "registers cctv as the default" do
    expect(described_class.default.key).to eq("cctv")
    expect(described_class.keys).to include("cctv")
  end

  it "fetches by key" do
    expect(described_class.fetch("cctv").name).to eq("CCTV")
  end

  it "registers social-quiztancing without public features" do
    config = described_class.fetch("social-quiztancing")

    expect(config.features).to be_empty
    expect(config.block_allowed?("family_feud")).to be(true)
    expect(config.block_allowed?("the_scene")).to be(false)
  end

  it "raises for an unknown key" do
    expect { described_class.fetch("nope") }.to raise_error(described_class::UnknownTenant)
  end

  it "validates the real registry" do
    expect(described_class.validate!).to be(true)
  end

  it "rejects a reserved key" do
    allow(described_class).to receive(:all).and_return([config("cctv"), config("www")])

    expect { described_class.validate! }.to raise_error(ArgumentError, /reserved/)
  end

  it "rejects duplicate keys" do
    allow(described_class).to receive(:all).and_return([config("cctv"), config("cctv")])

    expect { described_class.validate! }.to raise_error(ArgumentError, /duplicate/)
  end

  it "requires the default tenant" do
    allow(described_class).to receive(:all).and_return([config("other")])

    expect { described_class.validate! }.to raise_error(ArgumentError, /default/)
  end
end
