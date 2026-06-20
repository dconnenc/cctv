require "rails_helper"

RSpec.describe Analytics::Tracker do
  let(:experience) { double("Experience", id: "exp-1", code: "ABC", name: "My Show") }

  describe ".capture" do
    it "no-ops when distinct_id is blank" do
      expect(POSTHOG).not_to receive(:capture)

      described_class.capture(distinct_id: nil, event: "experience started")
    end

    it "forwards id, event, merged experience properties, and the experience group" do
      allow(POSTHOG).to receive(:capture)

      described_class.capture(
        distinct_id: "user-1",
        event: "experience started",
        properties: { foo: "bar" },
        experience: experience,
      )

      expect(POSTHOG).to have_received(:capture).with(
        distinct_id: "user-1",
        event: "experience started",
        properties: { foo: "bar", experience_code: "ABC", experience_name: "My Show" },
        groups: { "experience" => "exp-1" },
      )
    end

    it "omits the group and experience properties when no experience is given" do
      allow(POSTHOG).to receive(:capture)

      described_class.capture(distinct_id: "user-1", event: "ping", properties: { a: 1 })

      expect(POSTHOG).to have_received(:capture).with(
        distinct_id: "user-1",
        event: "ping",
        properties: { a: 1 },
      )
    end

    it "swallows client errors so analytics never breaks a request" do
      allow(POSTHOG).to receive(:capture).and_raise(StandardError, "boom")

      expect { described_class.capture(distinct_id: "u", event: "e") }.not_to raise_error
    end
  end

  describe ".identify_experience" do
    it "identifies the experience group with its name and code" do
      allow(POSTHOG).to receive(:group_identify)

      described_class.identify_experience(experience)

      expect(POSTHOG).to have_received(:group_identify).with(
        group_type: "experience",
        group_key: "exp-1",
        properties: { name: "My Show", code: "ABC" },
      )
    end

    it "no-ops when experience is blank" do
      expect(POSTHOG).not_to receive(:group_identify)

      described_class.identify_experience(nil)
    end
  end

  describe ".capture_exception" do
    it "forwards the exception, distinct_id, and properties to the client" do
      allow(POSTHOG).to receive(:capture_exception)
      error = RuntimeError.new("nope")

      described_class.capture_exception(error, distinct_id: "u", properties: { a: 1 })

      expect(POSTHOG).to have_received(:capture_exception).with(error, "u", { a: 1 })
    end
  end
end
