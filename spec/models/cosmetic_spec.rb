require "rails_helper"

RSpec.describe Cosmetic, type: :model do
  describe "granting beta-only cosmetics on create" do
    let!(:beta_user) { create(:user, created_at: Time.utc(2026, 1, 1)) }
    let!(:regular_user) { create(:user, created_at: Time.utc(2026, 8, 1)) }

    it "grants a new beta-only cosmetic to existing beta testers only" do
      frame = create(:cosmetic, :frame)

      expect(beta_user.reload.cosmetics).to include(frame)
      expect(regular_user.reload.cosmetics).not_to include(frame)
    end

    it "does not auto-grant non-beta cosmetics to anyone" do
      hat = create(:cosmetic)

      expect(beta_user.reload.cosmetics).not_to include(hat)
      expect(regular_user.reload.cosmetics).not_to include(hat)
    end
  end
end
