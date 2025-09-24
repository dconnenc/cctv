require "rails_helper"

RSpec.describe Experiences::Broadcaster do
  let(:experience) { create(:experience) }
  let(:broadcaster) { described_class.new(experience) }

  # Mock the broadcast calls to test without ActionCable
  let(:broadcast_calls) { [] }

  before do
    allow(broadcaster).to receive(:send_broadcast) do |stream_key, message|
      broadcast_calls << { stream_key: stream_key, message: message }
    end
  end

  describe "#broadcast_experience_update" do
    context "with no participants" do
      it "does not broadcast anything" do
        broadcaster.broadcast_experience_update
        expect(broadcast_calls).to be_empty
      end
    end

    context "with basic role-only participants" do
      let!(:host_participant) do
        create(:experience_participant, experience: experience, role: :host)
      end
      let!(:player_participant) do
        create(:experience_participant, experience: experience, role: :player)
      end
      let!(:audience_participant) do
        create(:experience_participant, experience: experience, role: :audience)
      end

      it "broadcasts to each participant with role-appropriate data" do
        broadcaster.broadcast_experience_update

        expect(broadcast_calls.size).to eq(3)

        # Check that each participant gets their own stream
        host_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{host_participant.id}") }
        player_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{player_participant.id}") }
        audience_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{audience_participant.id}") }

        expect(host_call).to be_present
        expect(player_call).to be_present
        expect(audience_call).to be_present

        # All should have the same experience data (no special blocks)
        [host_call, player_call, audience_call].each do |call|
          expect(call[:message]).to include(
            type: 'experience_updated',
            experience: hash_including(
              id: experience.id,
              code: experience.code,
              status: experience.status,
              blocks: []
            ),
            metadata: hash_including(
              stream_type: :role,
              timestamp: be_a(Float)
            )
          )
        end
      end

      it "includes correct metadata for each participant" do
        broadcaster.broadcast_experience_update

        host_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{host_participant.id}") }

        expect(host_call[:message][:metadata]).to include(
          stream_key: "role:host",
          stream_type: :role,
          participant_id: host_participant.id,
          role: :host,
          segments: []
        )
      end
    end

    context "with segment-targeted blocks" do
      let!(:host_participant) do
        create(:experience_participant, experience: experience, role: :host, segments: ["admin"])
      end
      let!(:vip_player_participant) do
        create(:experience_participant, experience: experience, role: :player, segments: ["vip"])
      end
      let!(:regular_audience_participant) do
        create(:experience_participant, experience: experience, role: :audience)
      end

      let!(:global_block) do
        create(:experience_block, experience: experience, status: :open)
      end
      let!(:vip_block) do
        create(:experience_block, experience: experience, status: :open, visible_to_segments: ["vip"])
      end

      it "broadcasts different experience data based on visibility" do
        broadcaster.broadcast_experience_update

        vip_player_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{vip_player_participant.id}") }
        audience_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{regular_audience_participant.id}") }



        # VIP player should see both blocks
        expect(vip_player_call[:message][:experience][:blocks].size).to eq(2)

        # Regular audience should only see global block
        expect(audience_call[:message][:experience][:blocks].size).to eq(1)
      end

      it "uses correct stream keys for segment-based participants" do
        broadcaster.broadcast_experience_update

        vip_player_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{vip_player_participant.id}") }

        expect(vip_player_call[:message][:metadata]).to include(
          stream_key: "role:player:segment:vip",
          stream_type: :role_segments,
          segments: ["vip"]
        )
      end

      it "falls back to role stream for participants with inactive segments" do
        broadcaster.broadcast_experience_update

        host_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{host_participant.id}") }

        # Host has "admin" segment but no blocks use it, so should fall back to role stream
        expect(host_call[:message][:metadata]).to include(
          stream_key: "role:host",
          stream_type: :role
        )
      end
    end

    context "with user-targeted blocks" do
      let!(:host_participant) do
        create(:experience_participant, experience: experience, role: :host)
      end
      let!(:targeted_player_participant) do
        create(:experience_participant, experience: experience, role: :player, segments: ["vip"])
      end
      let!(:regular_player_participant) do
        create(:experience_participant, experience: experience, role: :player)
      end

      let!(:global_block) do
        create(:experience_block, experience: experience, status: :open)
      end
      let!(:targeted_block) do
        create(:experience_block, experience: experience, status: :open, target_user_ids: [targeted_player_participant.user.id])
      end

      it "broadcasts different data to targeted vs non-targeted participants" do
        broadcaster.broadcast_experience_update

        targeted_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{targeted_player_participant.id}") }
        regular_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{regular_player_participant.id}") }



        # Targeted player should see both blocks
        expect(targeted_call[:message][:experience][:blocks].size).to eq(2)

        # Regular player should only see global block (targeted block should be filtered out)
        expect(regular_call[:message][:experience][:blocks].size).to eq(1)
      end

      it "uses user-specific stream key for targeted participants" do
        broadcaster.broadcast_experience_update

        targeted_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{targeted_player_participant.id}") }

        expect(targeted_call[:message][:metadata]).to include(
          stream_key: "user:#{targeted_player_participant.user.id}",
          stream_type: :targeted
        )
      end
    end

    context "with complex mixed targeting scenarios" do
      let!(:host_participant) do
        create(:experience_participant, experience: experience, role: :host, segments: ["admin"])
      end
      let!(:vip_player1) do
        create(:experience_participant, experience: experience, role: :player, segments: ["vip"])
      end
      let!(:vip_player2) do
        create(:experience_participant, experience: experience, role: :player, segments: ["vip"])
      end
      let!(:premium_player) do
        create(:experience_participant, experience: experience, role: :player, segments: ["premium"])
      end
      let!(:audience_participants) do
        create_list(:experience_participant, 3, experience: experience, role: :audience)
      end

      let!(:global_block) do
        create(:experience_block, experience: experience, status: :open)
      end
      let!(:vip_block) do
        create(:experience_block, experience: experience, status: :open, visible_to_segments: ["vip"])
      end
      let!(:targeted_block) do
        create(:experience_block, experience: experience, status: :open, target_user_ids: [vip_player1.user.id])
      end

      it "broadcasts efficiently without duplicating visibility calculations" do
        broadcaster.broadcast_experience_update

        # Should have broadcasted to all participants
        expect(broadcast_calls.size).to eq(7)

        # Group by stream type to verify efficiency
        stream_types = broadcast_calls.map { |call| call[:message][:metadata][:stream_type] }

        # Should have mix of role, role_segment, and targeted streams
        expect(stream_types).to include(:role, :role_segments, :targeted)
      end

      it "prioritizes user targeting over segment targeting" do
        broadcaster.broadcast_experience_update

        # vip_player1 is both in VIP segment AND individually targeted
        # Should use user stream, not segment stream
        vip_player1_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{vip_player1.id}") }

        expect(vip_player1_call[:message][:metadata]).to include(
          stream_key: "user:#{vip_player1.user.id}",
          stream_type: :targeted
        )
      end

      it "groups participants with same stream type efficiently" do
        broadcaster.broadcast_experience_update

        # Both VIP players (except the targeted one) should use same segment stream
        vip_player2_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{vip_player2.id}") }

        expect(vip_player2_call[:message][:metadata]).to include(
          stream_key: "role:player:segment:vip",
          stream_type: :role_segments
        )

        # All audience members should use same role stream
        audience_calls = broadcast_calls.select { |call|
          audience_participants.any? { |p| call[:stream_key].include?("participant_#{p.id}") }
        }

        audience_calls.each do |call|
          expect(call[:message][:metadata]).to include(
            stream_key: "role:audience",
            stream_type: :role
          )
        end
      end

      context "comprehensive AND logic test for multi-segment participants" do
        # Use fresh experience to avoid interference from parent context
        let(:isolated_experience) { create(:experience) }
        let(:isolated_broadcaster) { described_class.new(isolated_experience) }

        let!(:host_participant) do
          create(:experience_participant, experience: isolated_experience, role: :host)
        end
        let!(:multi_segment_player) do
          create(:experience_participant, experience: isolated_experience, role: :player, segments: ["vip", "premium", "beta"])
        end
        let!(:vip_only_player) do
          create(:experience_participant, experience: isolated_experience, role: :player, segments: ["vip"])
        end
        let!(:regular_player) do
          create(:experience_participant, experience: isolated_experience, role: :player)
        end

        let!(:global_block) do
          create(:experience_block, experience: isolated_experience, status: :open)
        end
        let!(:vip_only_block) do
          create(:experience_block, experience: isolated_experience, status: :open, visible_to_segments: ["vip"])
        end
        let!(:premium_only_block) do
          create(:experience_block, experience: isolated_experience, status: :open, visible_to_segments: ["premium"])
        end
        let!(:beta_only_block) do
          create(:experience_block, experience: isolated_experience, status: :open, visible_to_segments: ["beta"])
        end
        let!(:vip_premium_block) do
          create(:experience_block, experience: isolated_experience, status: :open, visible_to_segments: ["vip", "premium"])
        end
        let!(:exclusive_admin_block) do
          create(:experience_block, experience: isolated_experience, status: :open, visible_to_segments: ["admin"])
        end

        it "broadcasts correct content to participants based on ALL their segments (AND logic)" do
          # Mock the isolated broadcaster too
          allow(isolated_broadcaster).to receive(:send_broadcast) do |stream_key, message|
            broadcast_calls << { stream_key: stream_key, message: message }
          end

          isolated_broadcaster.broadcast_experience_update

          # Find broadcast calls for each participant type
          multi_segment_call = broadcast_calls.find { |call|
            call[:stream_key].include?("participant_#{multi_segment_player.id}")
          }
          vip_only_call = broadcast_calls.find { |call|
            call[:stream_key].include?("participant_#{vip_only_player.id}")
          }
          regular_call = broadcast_calls.find { |call|
            call[:stream_key].include?("participant_#{regular_player.id}")
          }

          # Multi-segment participant should see blocks from ALL their segments
          multi_segment_blocks = multi_segment_call[:message][:experience][:blocks]
          multi_segment_block_ids = multi_segment_blocks.map { |b| b[:id] }

          expect(multi_segment_block_ids).to include(global_block.id)       # Global block
          expect(multi_segment_block_ids).to include(vip_only_block.id)     # From VIP segment
          expect(multi_segment_block_ids).to include(premium_only_block.id) # From Premium segment
          expect(multi_segment_block_ids).to include(beta_only_block.id)    # From Beta segment
          expect(multi_segment_block_ids).to include(vip_premium_block.id)  # From VIP+Premium segments
          expect(multi_segment_block_ids).not_to include(exclusive_admin_block.id) # Not admin
          expect(multi_segment_blocks.size).to eq(5) # All 5 relevant blocks

          # VIP-only participant should see global + VIP blocks
          vip_only_blocks = vip_only_call[:message][:experience][:blocks]
          vip_only_block_ids = vip_only_blocks.map { |b| b[:id] }

          expect(vip_only_block_ids).to include(global_block.id)
          expect(vip_only_block_ids).to include(vip_only_block.id)
          expect(vip_only_block_ids).to include(vip_premium_block.id) # VIP qualifies for VIP+Premium block
          expect(vip_only_block_ids).not_to include(premium_only_block.id)
          expect(vip_only_block_ids).not_to include(beta_only_block.id)
          expect(vip_only_block_ids).not_to include(exclusive_admin_block.id)
          expect(vip_only_blocks.size).to eq(3)

          # Regular participant should see only global block
          regular_blocks = regular_call[:message][:experience][:blocks]
          regular_block_ids = regular_blocks.map { |b| b[:id] }

          expect(regular_block_ids).to include(global_block.id)
          expect(regular_block_ids).not_to include(vip_only_block.id)
          expect(regular_block_ids).not_to include(premium_only_block.id)
          expect(regular_block_ids).not_to include(beta_only_block.id)
          expect(regular_block_ids).not_to include(vip_premium_block.id)
          expect(regular_block_ids).not_to include(exclusive_admin_block.id)
          expect(regular_blocks.size).to eq(1)
        end

        it "uses correct composite stream key for multi-segment participant" do
          # Mock the isolated broadcaster too
          allow(isolated_broadcaster).to receive(:send_broadcast) do |stream_key, message|
            broadcast_calls << { stream_key: stream_key, message: message }
          end

          isolated_broadcaster.broadcast_experience_update

          multi_segment_call = broadcast_calls.find { |call|
            call[:stream_key].include?("participant_#{multi_segment_player.id}")
          }

          expect(multi_segment_call[:message][:metadata]).to include(
            stream_key: "role:player:segments:beta+premium+vip", # Sorted composite key
            stream_type: :role_segments,
            segments: ["beta", "premium", "vip"]
          )
        end
      end
    end
  end

  describe "ActionCable integration" do
    before do
      # Create a participant so broadcast actually happens
      create(
        :experience_participant, experience: experience, role: :host
      )

      # Don't mock send_broadcast since we want to test the real ActionCable call
      # This is needed to reset the global mock
      allow(broadcaster).to receive(:send_broadcast).and_call_original
    end

    it "calls ActionCable.server.broadcast when broadcasting" do
      expect(ActionCable.server).to receive(:broadcast).at_least(:once)

      broadcaster.broadcast_experience_update
    end
  end

  describe "integration with StreamKeyGenerator" do
    let!(:host_participant) do
      create(:experience_participant, experience: experience, role: :host)
    end
    let!(:vip_player) do
      create(:experience_participant, experience: experience, role: :player, segments: ["vip"])
    end
    let!(:vip_block) do
      create(:experience_block, experience: experience, visible_to_segments: ["vip"])
    end

    it "uses StreamKeyGenerator for consistent stream key generation" do
      broadcaster.broadcast_experience_update

      host_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{host_participant.id}") }
      vip_call = broadcast_calls.find { |call| call[:stream_key].include?("participant_#{vip_player.id}") }

      # ActionCable stream keys should follow the expected format
      expect(host_call[:stream_key]).to eq("experience_#{experience.id}_participant_#{host_participant.id}")
      expect(vip_call[:stream_key]).to eq("experience_#{experience.id}_participant_#{vip_player.id}")

      # Metadata should contain logical stream keys
      expect(host_call[:message][:metadata][:stream_key]).to eq("role:host")
      expect(vip_call[:message][:metadata][:stream_key]).to eq("role:player:segment:vip")
    end
  end

  describe "error handling" do
    context "when no representative participant is found for a stream" do
      it "skips broadcasting for that stream" do
        # Mock the stream key generator to return streams with no valid participants
        allow_any_instance_of(Experiences::StreamKeyGenerator).to receive(:participant_to_stream_mapping).and_return({})

        broadcaster.broadcast_experience_update

        expect(broadcast_calls).to be_empty
      end
    end

    context "when visibility service fails" do
      let!(:participant) do
        create(:experience_participant, experience: experience, role: :host)
      end

      it "handles visibility service errors gracefully" do
        allow_any_instance_of(Experiences::Visibility).to receive(:payload).and_raise(StandardError, "Visibility error")

        expect { broadcaster.broadcast_experience_update }.not_to raise_error
      end
    end
  end
end
