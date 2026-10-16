require "rails_helper"

RSpec.describe ExperienceBlockLink, ".would_create_cycle?" do
  it "does not follow links belonging to another tenant" do
    other = create(:tenant)
    parent = create(:experience_block)
    child = create(:experience_block, experience: parent.experience)
    ActsAsTenant.with_tenant(other) do
      foreign_a = create(:experience_block)
      foreign_b = create(:experience_block, experience: foreign_a.experience)
      ExperienceBlockLink.create!(parent_block: foreign_a, child_block: foreign_b, relationship: :depends_on)
    end

    expect(described_class.would_create_cycle?(parent.id, child.id)).to be(false)
  end

  it "does not see another tenant's ancestry when given its block ids" do
    other = create(:tenant)
    foreign_a, foreign_b = ActsAsTenant.with_tenant(other) do
      a = create(:experience_block)
      b = create(:experience_block, experience: a.experience)
      ExperienceBlockLink.create!(parent_block: a, child_block: b, relationship: :depends_on)
      [a, b]
    end

    expect(described_class.would_create_cycle?(foreign_a.id, foreign_b.id)).to be(false)
    expect(ActsAsTenant.with_tenant(other) { described_class.would_create_cycle?(foreign_a.id, foreign_b.id) }).to be(true)
  end
end
