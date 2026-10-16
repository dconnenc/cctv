require "rails_helper"

RSpec.describe "cross-tenant database constraints" do
  let(:other) { create(:tenant) }

  it "rejects a child row whose parent belongs to another tenant" do
    foreign_experience = ActsAsTenant.with_tenant(other) { create(:experience) }
    block = build(:experience_block, experience: foreign_experience)

    expect { block.save!(validate: false) }.to raise_error(ActiveRecord::InvalidForeignKey)
  end

  it "rejects a participant pointing at a user from another tenant" do
    experience = create(:experience)
    foreign_user = ActsAsTenant.with_tenant(other) { create(:user) }
    participant = build(:experience_participant, experience: experience, user: foreign_user)

    expect { participant.save!(validate: false) }.to raise_error(ActiveRecord::InvalidForeignKey)
  end

  it "rejects an experience whose creator belongs to another tenant" do
    foreign_user = ActsAsTenant.with_tenant(other) { create(:user) }
    experience = build(:experience, creator: foreign_user, code_slug: "cross-tenant")

    expect { experience.save!(validate: false) }.to raise_error(ActiveRecord::InvalidForeignKey)
  end

  it "cascades deletes within a tenant" do
    block = create(:experience_block)

    expect { block.experience.destroy! }.to change { ExperienceBlock.unscoped.where(id: block.id).count }.from(1).to(0)
  end
end
