require "rails_helper"

RSpec.describe Experiences::StreamVisibility do
  let(:experience) { create(:experience) }

  describe "#payload" do
    context "with role-only stream" do
      let(:visibility) { described_class.new(experience: experience, role: :audience) }
      
      let!(:open_block) do
        create(:experience_block, experience: experience, status: :open)
      end
      let!(:closed_block) do
        create(:experience_block, experience: experience, status: :closed)
      end

      it "returns blocks appropriate for the role" do
        payload = visibility.payload

        expect(payload[:experience][:blocks].size).to eq(1)
        expect(payload[:experience][:blocks].first[:id]).to eq(open_block.id)
      end

      it "includes experience metadata" do
        payload = visibility.payload

        expect(payload[:experience]).to include(
          id: experience.id,
          code: experience.code,
          status: experience.status
        )
      end
    end

    context "with host role" do
      let(:visibility) { described_class.new(experience: experience, role: :host) }
      
      let!(:open_block) do
        create(:experience_block, experience: experience, status: :open)
      end
      let!(:closed_block) do
        create(:experience_block, experience: experience, status: :closed)
      end

      it "shows closed blocks to hosts" do
        payload = visibility.payload

        expect(payload[:experience][:blocks].size).to eq(2)
        block_ids = payload[:experience][:blocks].map { |b| b[:id] }
        expect(block_ids).to include(open_block.id, closed_block.id)
      end

      it "includes visibility metadata for hosts" do
        payload = visibility.payload
        
        block = payload[:experience][:blocks].first
        expect(block).to have_key(:visible_to_roles)
        expect(block).to have_key(:visible_to_segments)
      end
    end

    context "with segment-based stream" do
      let(:visibility) { described_class.new(experience: experience, role: :player, segments: ["vip"]) }
      
      let!(:global_block) do
        create(:experience_block, experience: experience, status: :open)
      end
      let!(:vip_block) do
        create(:experience_block, experience: experience, status: :open, visible_to_segments: ["vip"])
      end
      let!(:premium_block) do
        create(:experience_block, experience: experience, status: :open, visible_to_segments: ["premium"])
      end

      it "shows global and segment-specific blocks" do
        payload = visibility.payload

        expect(payload[:experience][:blocks].size).to eq(2)
        block_ids = payload[:experience][:blocks].map { |b| b[:id] }
        expect(block_ids).to include(global_block.id, vip_block.id)
        expect(block_ids).not_to include(premium_block.id)
      end
    end

    context "with multi-segment stream" do
      let(:visibility) { described_class.new(experience: experience, role: :player, segments: ["vip", "premium"]) }
      
      let!(:global_block) do
        create(:experience_block, experience: experience, status: :open)
      end
      let!(:vip_block) do
        create(:experience_block, experience: experience, status: :open, visible_to_segments: ["vip"])
      end
      let!(:premium_block) do
        create(:experience_block, experience: experience, status: :open, visible_to_segments: ["premium"])
      end
      let!(:beta_block) do
        create(:experience_block, experience: experience, status: :open, visible_to_segments: ["beta"])
      end
      let!(:vip_premium_block) do
        create(:experience_block, experience: experience, status: :open, visible_to_segments: ["vip", "premium"])
      end

      it "shows blocks from ALL segments (AND logic)" do
        payload = visibility.payload

        expect(payload[:experience][:blocks].size).to eq(4)
        block_ids = payload[:experience][:blocks].map { |b| b[:id] }
        
        # Should see blocks from both segments
        expect(block_ids).to include(global_block.id)
        expect(block_ids).to include(vip_block.id)
        expect(block_ids).to include(premium_block.id)
        expect(block_ids).to include(vip_premium_block.id)
        
        # Should not see blocks from segments they don't have
        expect(block_ids).not_to include(beta_block.id)
      end
    end

    context "with user-targeted stream" do
      let(:target_user) { create(:user) }
      let(:other_user) { create(:user) }
      let(:visibility) { described_class.new(experience: experience, role: :player, target_user_ids: [target_user.id]) }
      
      let!(:global_block) do
        create(:experience_block, experience: experience, status: :open)
      end
      let!(:targeted_block) do
        create(:experience_block, experience: experience, status: :open, target_user_ids: [target_user.id])
      end
      let!(:other_targeted_block) do
        create(:experience_block, experience: experience, status: :open, target_user_ids: [other_user.id])
      end

      it "shows global and user-targeted blocks" do
        payload = visibility.payload

        expect(payload[:experience][:blocks].size).to eq(2)
        block_ids = payload[:experience][:blocks].map { |b| b[:id] }
        expect(block_ids).to include(global_block.id, targeted_block.id)
        expect(block_ids).not_to include(other_targeted_block.id)
      end
    end

    context "with role targeting" do
      let(:visibility) { described_class.new(experience: experience, role: :player) }
      
      let!(:global_block) do
        create(:experience_block, experience: experience, status: :open)
      end
      let!(:player_block) do
        create(:experience_block, experience: experience, status: :open, visible_to_roles: ["player"])
      end
      let!(:host_block) do
        create(:experience_block, experience: experience, status: :open, visible_to_roles: ["host"])
      end

      it "shows global and role-specific blocks" do
        payload = visibility.payload

        expect(payload[:experience][:blocks].size).to eq(2)
        block_ids = payload[:experience][:blocks].map { |b| b[:id] }
        expect(block_ids).to include(global_block.id, player_block.id)
        expect(block_ids).not_to include(host_block.id)
      end
    end

    context "with no role (nil)" do
      let(:visibility) { described_class.new(experience: experience, role: nil) }
      
      let!(:open_block) do
        create(:experience_block, experience: experience, status: :open)
      end

      it "shows no blocks for non-participants" do
        payload = visibility.payload

        expect(payload[:experience][:blocks]).to be_empty
      end
    end
  end

  describe "#block_visible_to_stream?" do
    let(:visibility) { described_class.new(experience: experience, role: :player, segments: ["vip"]) }
    
    let!(:vip_block) do
      create(:experience_block, experience: experience, status: :open, visible_to_segments: ["vip"])
    end
    let!(:premium_block) do
      create(:experience_block, experience: experience, status: :open, visible_to_segments: ["premium"])
    end

    it "returns true for visible blocks" do
      expect(visibility.block_visible_to_stream?(vip_block)).to be true
    end

    it "returns false for non-visible blocks" do
      expect(visibility.block_visible_to_stream?(premium_block)).to be false
    end
  end

  describe "response data handling" do
    context "for poll blocks" do
      let(:visibility) { described_class.new(experience: experience, role: :host) }
      let!(:poll_block) do
        create(:experience_block, experience: experience, status: :open, kind: "poll")
      end

      it "includes aggregate data for hosts but no user-specific responses" do
        payload = visibility.payload
        
        poll_data = payload[:experience][:blocks].first[:responses]
        expect(poll_data).to include(
          total: 0,
          user_response: nil,
          user_responded: false,
          aggregate: {}
        )
      end
    end

    context "for audience role" do
      let(:visibility) { described_class.new(experience: experience, role: :audience) }
      let!(:poll_block) do
        create(:experience_block, experience: experience, status: :open, kind: "poll")
      end

      it "does not include aggregate data for non-hosts" do
        payload = visibility.payload
        
        poll_data = payload[:experience][:blocks].first[:responses]
        expect(poll_data).to include(
          total: 0,
          user_response: nil,
          user_responded: false,
          aggregate: nil
        )
      end
    end
  end
end