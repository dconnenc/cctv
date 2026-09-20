require "rails_helper"

RSpec.describe Feedbacks::IssueBuilder do
  describe "#title" do
    it "labels a manual report by type" do
      feedback = create(:feedback, :bug, title: "Poll never opened")

      expect(described_class.new(feedback).title).to eq("[Bug] Poll never opened")
    end

    it "falls back to the first line of the description when no title is given" do
      feedback = create(:feedback, title: nil, description: "First line\nSecond line")

      expect(described_class.new(feedback).title).to eq("[General] First line")
    end

    it "uses the error message for an auto-filed report" do
      feedback = create(:feedback, :error_report)

      expect(described_class.new(feedback).title).to eq("[Error] Cannot read properties of undefined")
    end

    it "names the experience on a block digest" do
      experience = create(:experience, name: "Friday Night")
      block = create(:experience_block, :feedback, experience: experience)
      feedback = create(:feedback, :from_block, experience: experience, experience_block: block)

      expect(described_class.new(feedback).title).to eq("Audience feedback — Friday Night")
    end
  end

  describe "#labels" do
    it "tags auto-filed errors so they can be triaged separately" do
      feedback = create(:feedback, :error_report)

      expect(described_class.new(feedback).labels).to contain_exactly("feedback", "bug", "auto-reported")
    end

    it "does not tag a manually reported bug as auto-reported" do
      expect(described_class.new(create(:feedback, :bug)).labels).to contain_exactly("feedback", "bug")
    end
  end

  describe "#description" do
    it "includes the stack trace and fingerprint for an error" do
      feedback = create(:feedback, :error_report)
      description = described_class.new(feedback).description

      expect(description).to include("at Poll (Poll.tsx:12:4)")
      expect(description).to include("deadbeef")
    end

    it "renders a session replay link when one was captured" do
      feedback = create(
        :feedback,
        context: { "posthog_replay_url" => "https://posthog.example/replay/1" },
      )

      expect(described_class.new(feedback).description).to include("https://posthog.example/replay/1")
    end

    it "embeds uploaded images and links other attachments" do
      feedback = create(:feedback)
      builder = described_class.new(
        feedback,
        asset_urls: [
          { filename: "shot.png", content_type: "image/png", url: "https://linear.example/shot.png" },
          { filename: "clip.mp4", content_type: "video/mp4", url: "https://linear.example/clip.mp4" }
        ],
      )

      expect(builder.description).to include("![shot.png](https://linear.example/shot.png)")
      expect(builder.description).to include("[clip.mp4](https://linear.example/clip.mp4)")
    end

    it "includes console output" do
      feedback = create(
        :feedback,
        console_logs: [{ "level" => "error", "message" => "websocket closed" }],
      )

      expect(described_class.new(feedback).description).to include("[error] websocket closed")
    end

    it "names an anonymous reporter rather than leaving it blank" do
      feedback = create(:feedback, user: nil, source: Feedback::ERROR, description: nil)

      expect(described_class.new(feedback).description).to include("Anonymous")
    end
  end

  describe "#comment" do
    it "marks a repeat error as another occurrence" do
      feedback = create(:feedback, :error_report)

      expect(described_class.new(feedback).comment).to include("Another occurrence")
    end

    it "marks a rolled-up block submission as a new submission" do
      block = create(:experience_block, :feedback)
      feedback = create(:feedback, :from_block, experience_block: block, experience: block.experience)

      expect(described_class.new(feedback).comment).to include("New submission")
    end
  end
end
