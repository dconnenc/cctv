require "rails_helper"

RSpec.describe Feedbacks::Sanitizer do
  describe ".scrub_string" do
    it "removes JWTs so a participant token never reaches Linear" do
      jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.s1gnatur3"

      expect(described_class.scrub_string("token=#{jwt}")).not_to include(jwt)
    end

    it "removes bearer headers" do
      expect(described_class.scrub_string("Authorization: Bearer abc.def")).to include("[redacted]")
    end

    it "removes email addresses" do
      expect(described_class.scrub_string("from someone@example.com")).not_to include("example.com")
    end
  end

  describe ".context" do
    it "keeps only permitted keys" do
      result = described_class.context("route" => "/x", "cookies" => "session=1")

      expect(result).to eq("route" => "/x")
    end

    it "scrubs values it keeps" do
      result = described_class.context("error_message" => "failed for me@example.com")

      expect(result["error_message"]).not_to include("example.com")
    end
  end

  describe ".console_logs" do
    it "caps the buffer" do
      entries = Array.new(Feedback::MAX_CONSOLE_LOGS + 20) { |i| { "level" => "log", "message" => "line #{i}" } }

      expect(described_class.console_logs(entries).length).to eq(Feedback::MAX_CONSOLE_LOGS)
    end

    it "drops entries with no message" do
      expect(described_class.console_logs([{ "level" => "log", "message" => "" }])).to be_empty
    end

    it "defaults a missing level" do
      expect(described_class.console_logs([{ "message" => "hi" }]).first["level"]).to eq("log")
    end
  end
end
