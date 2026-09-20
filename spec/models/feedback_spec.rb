require "rails_helper"

RSpec.describe Feedback do
  describe "validations" do
    it "requires a description for manual feedback" do
      feedback = build(:feedback, description: nil)

      expect(feedback).not_to be_valid
      expect(feedback.errors[:description]).to be_present
    end

    it "allows an error report with no description, since it is filed before the user types" do
      expect(build(:feedback, :error_report)).to be_valid
    end
  end

  describe "#rollup_parent" do
    it "groups a repeat error onto the first report with the same fingerprint" do
      first = create(:feedback, :error_report, :synced, error_fingerprint: "abc123")
      repeat = create(:feedback, :error_report, error_fingerprint: "abc123")

      expect(repeat.rollup_parent).to eq(first)
    end

    it "does not group errors with different fingerprints" do
      create(:feedback, :error_report, :synced, error_fingerprint: "abc123")
      other = create(:feedback, :error_report, error_fingerprint: "different")

      expect(other.rollup_parent).to be_nil
    end

    it "does not group an error older than the dedupe window" do
      create(
        :feedback,
        :error_report,
        :synced,
        error_fingerprint: "abc123",
        created_at: (Feedback::ERROR_DEDUPE_WINDOW + 1.hour).ago,
      )
      repeat = create(:feedback, :error_report, error_fingerprint: "abc123")

      expect(repeat.rollup_parent).to be_nil
    end

    it "groups non-bug block submissions per block so a full room is one issue" do
      block = create(:experience_block, :feedback)
      first = create(:feedback, :from_block, :synced, experience_block: block, experience: block.experience)
      second = create(:feedback, :from_block, experience_block: block, experience: block.experience)

      expect(second.rollup_parent).to eq(first)
    end

    it "gives a bug reported through a feedback block its own issue" do
      block = create(:experience_block, :feedback)
      create(:feedback, :from_block, :synced, experience_block: block, experience: block.experience)
      bug = create(
        :feedback,
        :from_block,
        feedback_type: Feedback::BUG,
        experience_block: block,
        experience: block.experience,
      )

      expect(bug.rollup_parent).to be_nil
    end

    it "never groups manual feedback" do
      create(:feedback, :synced)

      expect(create(:feedback).rollup_parent).to be_nil
    end
  end

  describe "#linear_group_key" do
    it "locks errors on their fingerprint" do
      feedback = create(:feedback, :error_report, error_fingerprint: "abc123")

      expect(feedback.linear_group_key).to eq("error:abc123")
    end

    it "locks groupable block feedback on the block" do
      block = create(:experience_block, :feedback)
      feedback = create(:feedback, :from_block, experience_block: block, experience: block.experience)

      expect(feedback.linear_group_key).to eq("block:#{block.id}")
    end

    it "locks ungroupable feedback on itself so it never contends" do
      feedback = create(:feedback)

      expect(feedback.linear_group_key).to eq("feedback:#{feedback.id}")
    end
  end
end
