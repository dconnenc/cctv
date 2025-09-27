require "rails_helper"

RSpec.describe Experiences::Visibility do
  let(:experience) { create(:experience, status: experience_status) }
  let(:user) { create(:user, :user) }
  let(:participant_role) { ExperienceParticipant.roles[:audience] }
  let(:experience_status) { Experience.statuses[:draft] }

  let(:user_segment) { "user segment" }
  let(:other_segment) { "other segment" }

  before do
    create(
      :experience_participant,
      user: user,
      experience: experience,
      role: participant_role,
      segments: [user_segment]
    )
  end

  describe "#payload" do
    subject do
      described_class.new(
        experience: experience,
        user_role: user.role,
        participant_role: participant_role,
        segments: [user_segment],
        target_user_ids: [user.id]
      ).payload
    end

    describe "segment visibility" do
      context "when a blocks exists that has no targetting rules" do
        let!(:global_block) do
          create(
            :experience_block,
            experience: experience,
            visible_to_segments: [],
            visible_to_roles: [],
            target_user_ids: []
          )
        end

        it "returns a payload that includes only the matching block" do
          expect(subject[:experience][:blocks]).to eql([{
            id: global_block.id,
            kind: global_block.kind,
            status: global_block.status,
            payload: global_block.payload,
            responses: { aggregate: nil, total: 0, user_responded: false, user_response: nil }
          }])
        end
      end

      context "when a blocks exists that matches the participants's segment" do
        let!(:matching_experience_block) do
          create(
            :experience_block,
            experience: experience,
            visible_to_segments: [user_segment]
          )
        end

        let!(:non_matching_experience_block) do
          create(
            :experience_block,
            experience: experience,
            visible_to_segments: [other_segment]
          )
        end

        it "returns a payload that includes only the matching block" do
          expect(subject[:experience][:blocks]).to eql([{
            id: matching_experience_block.id,
            kind: matching_experience_block.kind,
            status: matching_experience_block.status,
            payload: matching_experience_block.payload,
            responses: { aggregate: nil, total: 0, user_responded: false, user_response: nil }
          }])
        end
      end
    end

    describe "role visibility" do
      let(:participant_role) { ExperienceParticipant.roles[:player] }

      context "when a block exists matches the user's role" do
        let!(:matching_experience_block) do
          create(
            :experience_block,
            experience: experience,
            visible_to_roles: ["player"]
          )
        end

        let!(:non_matching_experience_block) do
          create(
            :experience_block,
            experience: experience,
            visible_to_roles: ["audience"]
          )
        end

        it "returns a payload that includes only the matching block" do
          expect(subject[:experience][:blocks]).to eql([{
            id: matching_experience_block.id,
            kind: matching_experience_block.kind,
            status: matching_experience_block.status,
            payload: matching_experience_block.payload,
            responses: { aggregate: nil, total: 0, user_responded: false, user_response: nil }
          }])
        end
      end
    end

    describe "user targeting visibility" do
      context "when a block exists that targets the user" do
        let!(:targeted_experience_block) do
          create(
            :experience_block,
            experience: experience,
            target_user_ids: [user.id]
          )
        end

        let!(:non_targeted_experience_block) do
          create(
            :experience_block,
            experience: experience,
            target_user_ids: [create(:user).id]
          )
        end

        it "returns a payload that includes only the targeted block" do
          expect(subject[:experience][:blocks]).to eql([{
            id: targeted_experience_block.id,
            kind: targeted_experience_block.kind,
            status: targeted_experience_block.status,
            payload: targeted_experience_block.payload,
            responses: { aggregate: nil, total: 0, user_responded: false, user_response: nil }
          }])
        end
      end
    end

    describe "moderator and host visibility" do
      context "when user is a moderator" do
        let(:participant_role) { ExperienceParticipant.roles[:moderator] }

        let!(:closed_block) do
          create(
            :experience_block,
            experience: experience,
            status: :closed
          )
        end

        let!(:open_block) do
          create(
            :experience_block,
            experience: experience,
            status: :open
          )
        end

        it "returns blocks with visibility metadata" do
          blocks = subject[:experience][:blocks]

          closed_block_payload = blocks.find { |b| b[:id] == closed_block.id }

          expect(closed_block_payload).to include({
            id: closed_block.id,
            kind: closed_block.kind,
            status: closed_block.status,
            payload: closed_block.payload,
            visible_to_roles: closed_block.visible_to_roles,
            visible_to_segments: closed_block.visible_to_segments
          })
        end

        it "can see both open and closed blocks" do
          block_ids = subject[:experience][:blocks].map { |b| b[:id] }
          expect(block_ids).to include(closed_block.id, open_block.id)
        end
      end

      context "when user is a host" do
        let(:participant_role) { ExperienceParticipant.roles[:host] }

        let!(:closed_block) do
          create(
            :experience_block,
            experience: experience,
            status: :closed
          )
        end

        it "returns blocks with visibility metadata" do
          blocks = subject[:experience][:blocks]

          closed_block_payload = blocks.find { |b| b[:id] == closed_block.id }
          expect(closed_block_payload).to include({
            id: closed_block.id,
            kind: closed_block.kind,
            status: closed_block.status,
            payload: closed_block.payload,
            visible_to_roles: closed_block.visible_to_roles,
            visible_to_segments: closed_block.visible_to_segments
          })
        end

        it "can see closed blocks" do
          block_ids = subject[:experience][:blocks].map { |b| b[:id] }
          expect(block_ids).to include(closed_block.id)
        end
      end

      context "when user is audience" do
        let(:participant_role) { ExperienceParticipant.roles[:audience] }

        let!(:closed_block) do
          create(
            :experience_block,
            experience: experience,
            status: :closed
          )
        end

        let!(:open_block) do
          create(
            :experience_block,
            experience: experience,
            status: :open
          )
        end

        it "returns blocks without visibility metadata" do
          blocks = subject[:experience][:blocks]

          open_block_payload = blocks.find { |b| b[:id] == open_block.id }
          expect(open_block_payload).to eq({
            id: open_block.id,
            kind: open_block.kind,
            status: open_block.status,
            payload: open_block.payload,
            responses: { aggregate: nil, total: 0, user_responded: false, user_response: nil }
          })
        end

        it "cannot see closed blocks" do
          block_ids = subject[:experience][:blocks].map { |b| b[:id] }
          expect(block_ids).not_to include(closed_block.id)
          expect(block_ids).to include(open_block.id)
        end
      end
    end
  end

  describe ".payload_for_user" do
    subject { described_class.payload_for_user(experience: experience, user: user) }

    let!(:open_block) do
      create(
        :experience_block,
        experience: experience,
        status: :open
      )
    end

    it "returns payload for user" do
      expect(subject[:experience][:blocks].size).to eq(1)
      expect(subject[:experience][:blocks].first[:id]).to eq(open_block.id)
    end
  end

  describe ".payload_for_stream" do
    subject { described_class.payload_for_stream(experience: experience, role: :player, segments: ["vip"]) }

    let!(:vip_block) do
      create(
        :experience_block,
        experience: experience,
        visible_to_segments: ["vip"]
      )
    end

    let!(:premium_block) do
      create(
        :experience_block,
        experience: experience,
        visible_to_segments: ["premium"]
      )
    end

    it "returns payload for stream" do
      expect(subject[:experience][:blocks].size).to eq(1)
      expect(subject[:experience][:blocks].first[:id]).to eq(vip_block.id)
    end
  end

  describe ".block_visible_to_user?" do
    let!(:open_block) do
      create(
        :experience_block,
        experience: experience,
        status: :open
      )
    end

    let!(:closed_block) do
      create(
        :experience_block,
        experience: experience,
        status: :closed
      )
    end

    context "for regular user" do
      it "returns true for open blocks" do
        expect(described_class.block_visible_to_user?(block: open_block, user: user)).to be true
      end

      it "returns false for closed blocks" do
        expect(described_class.block_visible_to_user?(block: closed_block, user: user)).to be false
      end
    end

    context "for admin user" do
      let(:admin_user) { create(:user, :admin) }

      it "returns true for all blocks" do
        expect(described_class.block_visible_to_user?(block: open_block, user: admin_user)).to be true
        expect(described_class.block_visible_to_user?(block: closed_block, user: admin_user)).to be true
      end
    end
  end

  describe "non-participant access" do
    let(:non_participant_user) { create(:user, :user) }
    let(:experience) { create(:experience, status: :live) }

    subject { described_class.payload_for_user(experience: experience, user: non_participant_user) }

    before do
      other_user = create(:user, :user)
      create(:experience_participant, user: other_user, experience: experience, role: :audience)
      create(:experience_block, experience: experience, kind: "poll", status: "open")
    end

    it "returns no blocks for non-participants" do
      expect(subject[:experience][:blocks]).to be_empty
    end
  end

  describe "admin access" do
    let(:admin_user) { create(:user, :admin) }
    let(:experience) { create(:experience, status: :live) }

    subject { described_class.payload_for_user(experience: experience, user: admin_user) }

    before do
      create(:experience_block, experience: experience, kind: "poll", status: "open")
    end

    it "allows admin to see blocks even without being a participant" do
      expect(subject[:experience][:blocks]).not_to be_empty
    end
  end

  describe "#block_visible?" do
    let(:visibility) { described_class.new(experience: experience, participant_role: :player, segments: ["vip"]) }

    let!(:vip_block) do
      create(:experience_block, experience: experience, status: :open, visible_to_segments: ["vip"])
    end
    let!(:premium_block) do
      create(:experience_block, experience: experience, status: :open, visible_to_segments: ["premium"])
    end

    it "returns true for visible blocks" do
      expect(visibility.block_visible?(vip_block)).to be true
    end

    it "returns false for non-visible blocks" do
      expect(visibility.block_visible?(premium_block)).to be false
    end
  end

  describe "stream-like usage patterns" do
    describe "with role-only stream" do
      let(:visibility) { described_class.new(experience: experience, participant_role: :audience) }

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

    describe "with host role" do
      let(:visibility) { described_class.new(experience: experience, participant_role: :host) }

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

    describe "with segment-based stream" do
      let(:visibility) { described_class.new(experience: experience, participant_role: :player, segments: ["vip"]) }

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

    describe "with multi-segment stream" do
      let(:visibility) { described_class.new(experience: experience, participant_role: :player, segments: ["vip", "premium"]) }

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

        expect(block_ids).to include(global_block.id)
        expect(block_ids).to include(vip_block.id)
        expect(block_ids).to include(premium_block.id)
        expect(block_ids).to include(vip_premium_block.id)

        expect(block_ids).not_to include(beta_block.id)
      end
    end

    describe "with user-targeted stream" do
      let(:target_user) { create(:user) }
      let(:other_user) { create(:user) }
      let(:visibility) { described_class.new(experience: experience, participant_role: :player, target_user_ids: [target_user.id]) }

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

    describe "with role targeting" do
      let(:visibility) { described_class.new(experience: experience, participant_role: :player) }

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

    describe "with no role (nil)" do
      let(:visibility) { described_class.new(experience: experience, participant_role: nil) }

      let!(:open_block) do
        create(:experience_block, experience: experience, status: :open)
      end

      it "shows no blocks for non-participants" do
        payload = visibility.payload

        expect(payload[:experience][:blocks]).to be_empty
      end
    end
  end
end
