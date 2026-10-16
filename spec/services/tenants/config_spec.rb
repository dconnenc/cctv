require "rails_helper"

RSpec.describe Tenants::Config do
  let(:attributes) do
    {
      key: "acme",
      name: "Acme",
      blocks: %w[poll question],
      features: %w[events],
      theme: { display_name: "Acme" },
    }
  end

  it "builds a valid config" do
    config = described_class.new(attributes)

    expect(config.key).to eq("acme")
    expect(config.theme.display_name).to eq("Acme")
  end

  it "answers feature and block queries" do
    config = described_class.new(attributes)

    expect(config.feature?(:events)).to be(true)
    expect(config.feature?("performers")).to be(false)
    expect(config.block_allowed?("poll")).to be(true)
    expect(config.block_allowed?("buzzer")).to be(false)
  end

  it "rejects a key that is not a DNS label" do
    ["Acme", "-acme", "acme-", "a.b", "a_b", ""].each do |key|
      expect { described_class.new(attributes.merge(key: key)) }
        .to raise_error(Dry::Struct::Error), "expected #{key.inspect} to be rejected"
    end
  end

  it "rejects an unknown block kind" do
    expect { described_class.new(attributes.merge(blocks: %w[poll nope])) }
      .to raise_error(Dry::Struct::Error)
  end

  it "rejects an empty block list" do
    expect { described_class.new(attributes.merge(blocks: [])) }
      .to raise_error(Dry::Struct::Error)
  end

  it "rejects an unknown feature" do
    expect { described_class.new(attributes.merge(features: %w[teleport])) }
      .to raise_error(Dry::Struct::Error)
  end

  it "rejects unknown attributes so typos fail loudly" do
    expect { described_class.new(attributes.merge(bloks: %w[poll])) }
      .to raise_error(Dry::Struct::Error)
  end
end
