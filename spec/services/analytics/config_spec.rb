require "rails_helper"

RSpec.describe Analytics::Config do
  describe ".enabled?" do
    it "is false in the test environment regardless of POSTHOG_KEY" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("POSTHOG_KEY").and_return("phc_present")

      expect(described_class.enabled?).to be(false)
    end
  end

  describe ".host" do
    it "defaults to the US cloud ingestion host" do
      expect(described_class.host).to eq("https://us.i.posthog.com")
    end

    it "honors a POSTHOG_HOST override (e.g. EU cloud)" do
      allow(ENV).to receive(:fetch).and_call_original
      allow(ENV).to receive(:fetch).with("POSTHOG_HOST", anything).and_return("https://eu.i.posthog.com")

      expect(described_class.host).to eq("https://eu.i.posthog.com")
    end
  end

  describe ".session_replay?" do
    it "parses truthy strings" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("POSTHOG_SESSION_REPLAY").and_return("true")

      expect(described_class.session_replay?).to be(true)
    end

    it "defaults to false when unset" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("POSTHOG_SESSION_REPLAY").and_return(nil)

      expect(described_class.session_replay?).to be(false)
    end
  end

  describe ".client_config" do
    it "reports analytics off in test with the resolved host and environment" do
      expect(described_class.client_config).to include(
        enabled: false,
        host: "https://us.i.posthog.com",
        environment: "test",
        sessionReplay: false,
      )
    end
  end
end
