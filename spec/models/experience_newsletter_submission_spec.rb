require "rails_helper"

RSpec.describe ExperienceNewsletterSubmission, type: :model do
  let(:experience) { create(:experience) }
  let(:participant) { create(:experience_participant, experience: experience, role: :audience) }
  let(:block) { create(:experience_block, experience: experience, kind: "newsletter_signup", status: "open") }

  subject { build(:experience_newsletter_submission, experience_participant: participant, experience_block: block) }

  describe "validations" do
    it "is valid with valid attributes" do
      expect(subject).to be_valid
    end

    it "requires an answer" do
      subject.answer = nil
      expect(subject).not_to be_valid
      expect(subject.errors[:answer]).to include("can't be blank")
    end

    it "rejects a non-newsletter block" do
      block.update_column(:kind, "poll")
      expect(subject).not_to be_valid
      expect(subject.errors[:experience_block]).to include("must be a newsletter signup block")
    end
  end

  describe "associations" do
    it "belongs to experience_participant" do
      expect(subject.experience_participant).to eq(participant)
    end

    it "belongs to experience_block" do
      expect(subject.experience_block).to eq(block)
    end
  end
end
