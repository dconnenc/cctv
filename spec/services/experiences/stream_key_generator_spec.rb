require "rails_helper"

RSpec.describe Experiences::StreamKeyGenerator do
  let(:experience) { create(:experience) }
  let(:generator) { described_class.new(experience) }

  describe "#generate_stream_keys" do
    context "with no participants or blocks" do
      it "returns empty hash" do
        expect(generator.generate_stream_keys).to eq({})
      end
    end

    context "with basic role-only setup" do
      let!(:host_participant) do
        create(:experience_participant, experience: experience, role: :host)
      end
      let!(:player_participant) do
        create(:experience_participant, experience: experience, role: :player)
      end
      let!(:audience_participant) do
        create(:experience_participant, experience: experience, role: :audience)
      end

      it "generates role-based stream keys" do
        keys = generator.generate_stream_keys

        expect(keys).to include(
          "role:host" => {
            type: :role,
            role: :host,
            segments: [],
            target_user_ids: []
          },
          "role:player" => {
            type: :role,
            role: :player,
            segments: [],
            target_user_ids: []
          },
          "role:audience" => {
            type: :role,
            role: :audience,
            segments: [],
            target_user_ids: []
          }
        )
      end
    end

    context "with segment-targeted blocks" do
      let!(:host_participant) do
        create(:experience_participant, experience: experience, role: :host, segments: ["vip"])
      end
      let!(:player_participant) do
        create(:experience_participant, experience: experience, role: :player, segments: ["premium"])
      end
      let!(:vip_block) do
        create(:experience_block, experience: experience, visible_to_segments: ["vip"])
      end
      let!(:premium_block) do
        create(:experience_block, experience: experience, visible_to_segments: ["premium"])
      end

      it "generates role and role+segment stream keys" do
        keys = generator.generate_stream_keys

        expect(keys).to include(
          "role:host" => {
            type: :role,
            role: :host,
            segments: [],
            target_user_ids: []
          },
          "role:player" => {
            type: :role,
            role: :player,
            segments: [],
            target_user_ids: []
          },
          "role:host:segment:vip" => {
            type: :role_segments,
            role: :host,
            segments: ["vip"],
            target_user_ids: []
          },
          "role:player:segment:vip" => {
            type: :role_segments,
            role: :player,
            segments: ["vip"],
            target_user_ids: []
          },
          "role:host:segment:premium" => {
            type: :role_segments,
            role: :host,
            segments: ["premium"],
            target_user_ids: []
          },
          "role:player:segment:premium" => {
            type: :role_segments,
            role: :player,
            segments: ["premium"],
            target_user_ids: []
          }
        )
      end

      it "does not generate segment streams for unused segments" do
        keys = generator.generate_stream_keys

        expect(keys.keys).not_to include("role:host:segment:unused")
        expect(keys.keys).not_to include("role:player:segment:unused")
      end
    end

    context "with user-targeted blocks" do
      let!(:host_participant) do
        create(:experience_participant, experience: experience, role: :host)
      end
      let!(:player_participant) do
        create(:experience_participant, experience: experience, role: :player, segments: ["vip"])
      end
      let!(:targeted_block) do
        create(:experience_block, experience: experience, target_user_ids: [player_participant.user.id])
      end

      it "generates individual user stream keys" do
        keys = generator.generate_stream_keys

        expect(keys).to include(
          "user:#{player_participant.user.id}" => {
            type: :targeted,
            role: :player,
            segments: ["vip"],
            target_user_ids: [player_participant.user.id]
          }
        )
      end

      it "does not generate user streams for non-participants" do
        non_participant_user = create(:user)
        create(:experience_block, experience: experience, target_user_ids: [non_participant_user.id])

        keys = generator.generate_stream_keys

        expect(keys.keys).not_to include("user:#{non_participant_user.id}")
      end
    end

    context "with complex mixed targeting" do
      let!(:host_participant) do
        create(:experience_participant, experience: experience, role: :host, segments: ["admin"])
      end
      let!(:vip_player_participant) do
        create(:experience_participant, experience: experience, role: :player, segments: ["vip"])
      end
      let!(:premium_player_participant) do
        create(:experience_participant, experience: experience, role: :player, segments: ["premium"])
      end
      let!(:audience_participant) do
        create(:experience_participant, experience: experience, role: :audience)
      end

      let!(:global_block) do
        create(:experience_block, experience: experience)
      end
      let!(:vip_block) do
        create(:experience_block, experience: experience, visible_to_segments: ["vip"])
      end
      let!(:targeted_block) do
        create(:experience_block, experience: experience, target_user_ids: [vip_player_participant.user.id])
      end

      it "generates appropriate mix of stream types" do
        keys = generator.generate_stream_keys

        # Base role streams
        expect(keys.keys).to include("role:host", "role:player", "role:audience")

        # Segment streams (only for segments used in blocks)
        expect(keys.keys).to include("role:host:segment:vip", "role:player:segment:vip", "role:audience:segment:vip")
        expect(keys.keys).not_to include("role:host:segment:admin") # admin segment not used in blocks
        expect(keys.keys).not_to include("role:player:segment:premium") # premium segment not used in blocks

        # User streams
        expect(keys.keys).to include("user:#{vip_player_participant.user.id}")
      end
    end
  end

  describe "#stream_key_for_participant" do
    let!(:host_participant) do
      create(:experience_participant, experience: experience, role: :host, segments: ["admin"])
    end
    let!(:vip_player_participant) do
      create(:experience_participant, experience: experience, role: :player, segments: ["vip"])
    end
    let!(:regular_audience_participant) do
      create(:experience_participant, experience: experience, role: :audience)
    end

    context "with no special targeting" do
      it "returns role-based stream key" do
        key = generator.stream_key_for_participant(regular_audience_participant)
        expect(key).to eq("role:audience")
      end
    end

    context "with segment targeting available" do
      let!(:vip_block) do
        create(:experience_block, experience: experience, visible_to_segments: ["vip"])
      end

      it "returns role+segment stream key for participants with active segments" do
        key = generator.stream_key_for_participant(vip_player_participant)
        expect(key).to eq("role:player:segment:vip")
      end

      it "falls back to role stream key for participants with inactive segments" do
        key = generator.stream_key_for_participant(host_participant) # has "admin" segment, but no blocks use it
        expect(key).to eq("role:host")
      end
    end

    context "with user targeting" do
      let!(:targeted_block) do
        create(:experience_block, experience: experience, target_user_ids: [vip_player_participant.user.id])
      end

      it "returns user stream key for targeted participants" do
        key = generator.stream_key_for_participant(vip_player_participant)
        expect(key).to eq("user:#{vip_player_participant.user.id}")
      end
    end

    context "with multiple targeting options" do
      let!(:vip_block) do
        create(:experience_block, experience: experience, visible_to_segments: ["vip"])
      end
      let!(:targeted_block) do
        create(:experience_block, experience: experience, target_user_ids: [vip_player_participant.user.id])
      end

      it "prioritizes user targeting over segment targeting" do
        key = generator.stream_key_for_participant(vip_player_participant)
        expect(key).to eq("user:#{vip_player_participant.user.id}")
      end
    end

    context "with participant having multiple segments" do
      let!(:multi_segment_participant) do
        create(:experience_participant, experience: experience, role: :player, segments: ["vip", "premium"])
      end
      let!(:vip_block) do
        create(:experience_block, experience: experience, visible_to_segments: ["vip"])
      end
      let!(:premium_block) do
        create(:experience_block, experience: experience, visible_to_segments: ["premium"])
      end

      it "returns composite stream key for all active segments" do
        key = generator.stream_key_for_participant(multi_segment_participant)
        # Should include all active segments in sorted order
        expect(key).to eq("role:player:segments:premium+vip")
      end
    end
  end

  describe "#action_cable_stream_key_for_participant" do
    let!(:participant) do
      create(:experience_participant, experience: experience)
    end

    it "generates correctly formatted ActionCable stream key" do
      key = generator.action_cable_stream_key_for_participant(participant)
      expect(key).to eq("experience_#{experience.id}_participant_#{participant.id}")
    end
  end

  describe "stream key builders" do
    describe "#build_role_stream_key" do
      it "formats role stream key correctly" do
        expect(generator.build_role_stream_key(:host)).to eq("role:host")
        expect(generator.build_role_stream_key(:player)).to eq("role:player")
      end
    end

    describe "#build_user_stream_key" do
      it "formats user stream key correctly" do
        expect(generator.build_user_stream_key("123")).to eq("user:123")
        expect(generator.build_user_stream_key(456)).to eq("user:456")
      end
    end
  end

  describe "multi-segment participants" do
    let!(:host_participant) do
      create(:experience_participant, experience: experience, role: :host)
    end
    let!(:multi_segment_participant) do
      create(:experience_participant, experience: experience, role: :player, segments: ["vip", "premium"])
    end

    context "when both segments have blocks" do
      let!(:vip_block) do
        create(:experience_block, experience: experience, visible_to_segments: ["vip"])
      end
      let!(:premium_blocks) do
        create_list(:experience_block, 2, experience: experience, visible_to_segments: ["premium"])
      end

      it "uses composite stream key to access blocks from all segments" do
        key = generator.stream_key_for_participant(multi_segment_participant)
        # Should use composite key that gives access to blocks from both segments
        expect(key).to eq("role:player:segments:premium+vip")
      end
    end

    context "when only one segment has blocks" do
      let!(:vip_block) do
        create(:experience_block, experience: experience, visible_to_segments: ["vip"])
      end

      it "uses only the active segment" do
        key = generator.stream_key_for_participant(multi_segment_participant)
        expect(key).to eq("role:player:segment:vip")
      end
    end

    context "when no segments have blocks" do
      it "falls back to role-based stream" do
        key = generator.stream_key_for_participant(multi_segment_participant)
        expect(key).to eq("role:player")
      end
    end

    context "with equal block counts" do
      let!(:vip_block) do
        create(:experience_block, experience: experience, visible_to_segments: ["vip"])
      end
      let!(:premium_block) do
        create(:experience_block, experience: experience, visible_to_segments: ["premium"])
      end

      it "uses composite stream key consistently" do
        key = generator.stream_key_for_participant(multi_segment_participant)
        # Should be deterministic composite key with sorted segments
        expect(key).to eq("role:player:segments:premium+vip")
      end
    end
  end

  describe "AND logic for multi-segment participants" do
    let!(:multi_segment_participant) do
      create(:experience_participant, experience: experience, role: :player, segments: ["vip", "premium", "beta"])
    end

    let!(:vip_only_block) do
      create(:experience_block, experience: experience, status: :open, visible_to_segments: ["vip"])
    end
    let!(:premium_only_block) do
      create(:experience_block, experience: experience, status: :open, visible_to_segments: ["premium"])
    end
    let!(:beta_only_block) do
      create(:experience_block, experience: experience, status: :open, visible_to_segments: ["beta"])
    end
    let!(:vip_premium_block) do
      create(:experience_block, experience: experience, status: :open, visible_to_segments: ["vip", "premium"])
    end
    let!(:unrelated_block) do
      create(:experience_block, experience: experience, status: :open, visible_to_segments: ["admin"])
    end

    it "creates composite stream key with all active segments" do
      key = generator.stream_key_for_participant(multi_segment_participant)
      # All three segments are used in blocks, so should get composite key
      expect(key).to eq("role:player:segments:beta+premium+vip")
    end

    it "generates stream that includes all segment combinations used by participants" do
      keys = generator.generate_stream_keys

      # Should generate the composite stream for this participant's combination
      expect(keys).to have_key("role:player:segments:beta+premium+vip")
      expect(keys["role:player:segments:beta+premium+vip"]).to eq({
        type: :role_segments,
        role: :player,
        segments: ["beta", "premium", "vip"],
        target_user_ids: []
      })
    end

    it "participant with composite stream would see blocks from all their segments via visibility" do
      # This test demonstrates that the Visibility service correctly handles multi-segment participants
      # when they get a composite stream key

      visibility = Experiences::Visibility.new(
        experience: experience,
        user: multi_segment_participant.user
      )

      visible_blocks = visibility.payload[:experience][:blocks]
      visible_block_ids = visible_blocks.map { |b| b[:id] }

      # Should see blocks from ALL their segments
      expect(visible_block_ids).to include(vip_only_block.id)
      expect(visible_block_ids).to include(premium_only_block.id)
      expect(visible_block_ids).to include(beta_only_block.id)
      expect(visible_block_ids).to include(vip_premium_block.id)

      # Should NOT see blocks from segments they don't have
      expect(visible_block_ids).not_to include(unrelated_block.id)

      # Should see 4 blocks total (3 individual + 1 multi-segment)
      expect(visible_blocks.size).to eq(4)
    end

    context "when participant has segments but only some are used in blocks" do
      let!(:mixed_segment_participant) do
        create(:experience_participant, experience: experience, role: :player, segments: ["vip", "unused", "premium"])
      end

      it "creates stream key with only active segments" do
        key = generator.stream_key_for_participant(mixed_segment_participant)
        # Only vip and premium are used in blocks, "unused" should be filtered out
        expect(key).to eq("role:player:segments:premium+vip")
      end

      it "generates streams only for segment combinations that have blocks" do
        keys = generator.generate_stream_keys

        # Should have the filtered composite stream
        expect(keys).to have_key("role:player:segments:premium+vip")

        # Should NOT have stream with unused segment
        expect(keys).not_to have_key("role:player:segments:premium+unused+vip")
      end
    end
  end

  describe "#participant_to_stream_mapping" do
    let!(:host_participant) do
      create(:experience_participant, experience: experience, role: :host)
    end
    let!(:vip_player_participant) do
      create(:experience_participant, experience: experience, role: :player, segments: ["vip"])
    end
    let!(:vip_block) do
      create(:experience_block, experience: experience, visible_to_segments: ["vip"])
    end

    it "maps participants to their appropriate streams" do
      mapping = generator.participant_to_stream_mapping

      expect(mapping[host_participant.id]).to include(
        participant: host_participant,
        logical_stream_key: "role:host",
        action_cable_stream_key: "experience_#{experience.id}_participant_#{host_participant.id}",
        stream_data: hash_including(type: :role, role: :host)
      )

      expect(mapping[vip_player_participant.id]).to include(
        participant: vip_player_participant,
        logical_stream_key: "role:player:segment:vip",
        action_cable_stream_key: "experience_#{experience.id}_participant_#{vip_player_participant.id}",
        stream_data: hash_including(type: :role_segments, role: :player, segments: ["vip"])
      )
    end
  end
end
