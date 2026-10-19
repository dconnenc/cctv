require "rails_helper"

RSpec.describe Tenants::Config do
  let(:attributes) do
    {
      key: "acme",
      name: "Acme",
      blocks: %w[poll question],
      features: %w[events],
      theme: { display_name: "Acme", tagline: "ACME TV", ticket_tagline: "ACME", site_name: "acme.tv", description: "About Acme" },
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

  it "rejects an empty name" do
    expect { described_class.new(attributes.merge(name: "")) }.to raise_error(Dry::Struct::Error)
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

  describe "theme" do
    let(:theme) do
      { display_name: "Acme", tagline: "ACME TV", ticket_tagline: "ACME", site_name: "acme.tv", description: "About Acme" }
    end

    it "defaults css variables to empty" do
      expect(described_class.new(attributes).theme.css_variables).to eq({})
    end

    it "accepts css variables" do
      config = described_class.new(attributes.merge(theme: theme.merge(css_variables: { "--phosphor" => "#fff" })))

      expect(config.theme.css_variables).to eq("--phosphor" => "#fff")
    end

    it "rejects css variable names that are not custom properties" do
      ["color", "--Upper", "--x;", "--x:y", "--x}", "--</style>", "-- x"].each do |name|
        expect { described_class.new(attributes.merge(theme: theme.merge(css_variables: { name => "red" }))) }
          .to raise_error(Dry::Struct::Error), "expected #{name.inspect} to be rejected"
      end
    end

    it "accepts colors and lengths as css variable values" do
      ["210 100% 55%", "#1a2b3c", "hsl(210 100% 55% / 0.5)", "12px", "0 0 8px rgba(0, 0, 0, 0.4)"].each do |value|
        config = described_class.new(attributes.merge(theme: theme.merge(css_variables: { "--x" => value })))

        expect(config.theme.css_variables).to eq("--x" => value)
      end
    end

    it "rejects css variable values that could break out of a declaration or fetch resources" do
      [
        "red; } body { display:none", "</style>", "{x}", "a<b", "a>b", "", "red\n}",
        "url(https://x.test/a.png)", "URL(x)", "\"quoted\"", "'single'", "red\\", "a /* b", "a\n/* b", "a\nurl(x)",
      ].each do |value|
        expect { described_class.new(attributes.merge(theme: theme.merge(css_variables: { "--x" => value }))) }
          .to raise_error(Dry::Struct::Error), "expected #{value.inspect} to be rejected"
      end
    end

    it "requires a ticket tagline but allows it to be empty" do
      expect { described_class.new(attributes.merge(theme: theme.except(:ticket_tagline))) }
        .to raise_error(Dry::Struct::Error)
      expect(described_class.new(attributes.merge(theme: theme.merge(ticket_tagline: ""))).theme.ticket_tagline).to eq("")
    end

    it "rejects an empty display name" do
      expect { described_class.new(attributes.merge(theme: theme.merge(display_name: ""))) }
        .to raise_error(Dry::Struct::Error)
    end

    it "requires site name and description" do
      expect { described_class.new(attributes.merge(theme: theme.merge(site_name: ""))) }
        .to raise_error(Dry::Struct::Error)
      expect { described_class.new(attributes.merge(theme: theme.except(:description))) }
        .to raise_error(Dry::Struct::Error)
    end
  end
end
