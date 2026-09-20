require "rails_helper"

RSpec.describe Linear::Config do
  describe ".enabled?" do
    before { allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new("production")) }

    it "is off without an API key, so feedback still records but never syncs" do
      stub_const("ENV", ENV.to_h.merge("LINEAR_API_KEY" => nil, "LINEAR_TEAM_KEY" => "CCT"))

      expect(described_class).not_to be_enabled
    end

    it "is off when the team key is missing rather than guessing a destination" do
      stub_const("ENV", ENV.to_h.merge("LINEAR_API_KEY" => "lin_api_x", "LINEAR_TEAM_KEY" => nil))

      expect(described_class).not_to be_enabled
    end

    it "is on when both are configured" do
      stub_const("ENV", ENV.to_h.merge("LINEAR_API_KEY" => "lin_api_x", "LINEAR_TEAM_KEY" => "CCT"))

      expect(described_class).to be_enabled
    end
  end

  it "is always off in test so specs never reach the network" do
    stub_const("ENV", ENV.to_h.merge("LINEAR_API_KEY" => "lin_api_x", "LINEAR_TEAM_KEY" => "CCT"))

    expect(described_class).not_to be_enabled
  end
end
