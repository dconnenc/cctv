require "rails_helper"

RSpec.describe ExperienceBlock, "tenant block allowlist" do
  let(:quiz) { Tenant.find_by!(key: "social-quiztancing") }

  it "allows every kind on cctv" do
    ExperienceBlock::KINDS.each do |kind|
      expect(build(:experience_block, kind: kind)).to be_valid, "expected #{kind} to be allowed on cctv"
    end
  end

  it "allows a permitted kind on social-quiztancing" do
    ActsAsTenant.with_tenant(quiz) do
      expect(build(:experience_block, kind: "poll")).to be_valid
    end
  end

  it "rejects a disallowed kind on social-quiztancing" do
    ActsAsTenant.with_tenant(quiz) do
      block = build(:experience_block, kind: "the_scene")

      expect(block).not_to be_valid
      expect(block.errors[:kind]).to include("is not available for this tenant")
    end
  end

  it "does not retro-validate existing blocks" do
    block = ActsAsTenant.with_tenant(quiz) { create(:experience_block, kind: "poll") }
    block.update_column(:kind, "the_scene")

    ActsAsTenant.with_tenant(quiz) { expect(block.reload).to be_valid }
  end
end
