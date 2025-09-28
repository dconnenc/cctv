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

  def broadcast_call_for(calls, participant)
    calls.find do |call|
      call[:stream_key].include?("participant_#{participant.id}")
    end
  end

  let(:global_block) do
    create(:experience_block, experience: experience, status: :open)
  end

  let(:segment_block) do
    create(
      :experience_block,
      experience: experience,
      status: :open,
      visible_to_segments: segment_block_segments
    )
  end

  let(:targeted_block) do
    create(
      :experience_block,
      experience: experience,
      status: :open,
      target_user_ids: targeted_block_users
    )
  end

  let(:segment_block_segments) { [] }
  let(:targeted_block_users) { [] }

  describe "#broadcast_experience_update" do
    subject { broadcaster.broadcast_experience_update }

    context "with no participants" do
      it "does not broadcast anything" do
        subject
        expect(broadcast_calls).to be_empty
      end
    end

    context "with participants" do
      let!(:host_participant) do
        create(
         :experience_participant,
         experience: experience,
         role: :host,
         segments: host_segments
        )
      end

      let!(:player_participant) do
        create(
          :experience_participant,
          experience: experience,
          role: :player,
          segments: player_segments
        )
      end

      let!(:audience_participant) do
        create(
          :experience_participant,
          experience: experience,
          role: :audience,
          segments: audience_segments
        )
      end

      let(:host_segments) { [] }
      let(:player_segments) { [] }
      let(:audience_segments) { [] }

      context "when there are no blocks" do
        before { subject }

        it "broadcasts three messages" do
          expect(broadcast_calls.size).to eq(3)
        end

        it "broadcasts the correct message structure to all participants" do
          [host_participant, player_participant, audience_participant].each do |participant|
            message = broadcast_call_for(broadcast_calls, participant)

            expect(message).to be_present
            expect(message[:message]).to include(
              type: 'experience_updated',
              experience: hash_including(
                id: experience.id,
                code: experience.code,
                status: experience.status,
                blocks: []
              ),
              metadata: hash_including(
                stream_type: :direct,
                timestamp: be_a(Float),
                stream_key: "participant_#{participant.id}",
                participant_id: participant.id,
                role: participant.role.to_sym,
                segments: []
              )
            )
          end
        end
      end

      context "with segment-targeted blocks" do
        let(:host_segments) { ["admin"] }
        let(:player_segments) { ["vip"] }
        let(:segment_block_segments) { ["vip"] }

        before do
          global_block
          segment_block
          subject
        end

        it "broadcasts global and vip blocks to the vip participant" do
          expect(
            broadcast_call_for(
              broadcast_calls, player_participant
            )[:message][:experience][:blocks].size
          ).to eq(2)
        end

        it "broadcasts only the global block to the audience participant" do
          expect(
            broadcast_call_for(
              broadcast_calls, audience_participant
            )[:message][:experience][:blocks].size
          ).to eq(1)
        end

        it "includes segment information in metadata" do
          expect(
            broadcast_call_for(
              broadcast_calls, player_participant
            )[:message][:metadata]
          ).to include(
            stream_key: "participant_#{player_participant.id}",
            stream_type: :direct,
            segments: ["vip"]
          )
        end
      end

      context "with user-targeted blocks" do
        let(:targeted_block_users) { [player_participant.user.id] }

        before do
          global_block
          targeted_block
          subject
        end

        describe "broadcasts correct block visibility" do
          it "shows both blocks to targeted participant" do
            expect(
              broadcast_call_for(
                broadcast_calls, player_participant
              )[:message][:experience][:blocks].size
            ).to eq(2)
          end

          it "shows only global block to non-targeted participant" do
            expect(
              broadcast_call_for(
                broadcast_calls, audience_participant
              )[:message][:experience][:blocks].size
            ).to eq(1)
          end
        end
      end

      context "with multi-segment participants" do
        let(:player_segments) { ["vip", "premium", "beta"] }
        let(:audience_segments) { ["vip"] }

        let(:vip_block_segments) { ["vip"] }
        let(:premium_block_segments) { ["premium"] }
        let(:beta_block_segments) { ["beta"] }
        let(:vip_premium_block_segments) { ["vip", "premium"] }
        let(:admin_block_segments) { ["admin"] }

        let(:vip_block) do
          create(
            :experience_block,
            experience: experience,
            status: :open,
            visible_to_segments: vip_block_segments
          )
        end

        let(:premium_block) do
          create(
            :experience_block,
            experience: experience,
            status: :open,
            visible_to_segments: premium_block_segments
          )
        end

        let(:beta_block) do
          create(
            :experience_block,
            experience: experience,
            status: :open,
            visible_to_segments: beta_block_segments
          )
        end

        let(:vip_premium_block) do
          create(
            :experience_block,
            experience: experience,
            status: :open,
            visible_to_segments: vip_premium_block_segments
          )
        end

        let(:admin_block) do
          create(
            :experience_block,
            experience: experience,
            status: :open,
            visible_to_segments: admin_block_segments
          )
        end

        before do
          global_block
          vip_block
          premium_block
          beta_block
          vip_premium_block
          admin_block
          subject
        end

        describe "player with multiple segments" do
          it "sees blocks from all their segments" do
            blocks = broadcast_call_for(
              broadcast_calls, player_participant
            )[:message][:experience][:blocks]

            block_ids = blocks.map { |b| b[:id] }

            expect(block_ids).to include(global_block.id)
            expect(block_ids).to include(vip_block.id)
            expect(block_ids).to include(premium_block.id)
            expect(block_ids).to include(beta_block.id)
            expect(block_ids).to include(vip_premium_block.id)
            expect(block_ids).not_to include(admin_block.id)
            expect(blocks.size).to eq(5)
          end
        end

        describe "audience with single segment" do
          it "sees blocks for their segment plus global" do
            blocks = broadcast_call_for(
              broadcast_calls, audience_participant
            )[:message][:experience][:blocks]

            block_ids = blocks.map { |b| b[:id] }

            expect(block_ids).to include(global_block.id)
            expect(block_ids).to include(vip_block.id)
            expect(block_ids).to include(vip_premium_block.id)
            expect(block_ids).not_to include(premium_block.id)
            expect(block_ids).not_to include(beta_block.id)
            expect(block_ids).not_to include(admin_block.id)
            expect(blocks.size).to eq(3)
          end
        end

        describe "host with no segments" do
          it "sees only global block" do
            blocks = broadcast_call_for(
              broadcast_calls, host_participant
            )[:message][:experience][:blocks]

            block_ids = blocks.map { |b| b[:id] }

            expect(block_ids).to include(global_block.id)
            expect(block_ids).not_to include(vip_block.id)
            expect(block_ids).not_to include(premium_block.id)
            expect(block_ids).not_to include(beta_block.id)
            expect(block_ids).not_to include(vip_premium_block.id)
            expect(block_ids).not_to include(admin_block.id)
            expect(blocks.size).to eq(1)
          end
        end
      end
    end
  end

  describe "ActionCable integration" do
    let!(:host_participant) do
      create(:experience_participant, experience: experience, role: :host)
    end

    before do
      allow(broadcaster).to receive(:send_broadcast).and_call_original
    end

    it "calls ActionCable.server.broadcast when broadcasting" do
      expect(ActionCable.server).to receive(:broadcast).at_least(:once)
      broadcaster.broadcast_experience_update
    end
  end

  describe "error handling" do
    let!(:host_participant) do
      create(:experience_participant, experience: experience, role: :host)
    end

    context "when visibility service fails" do
      before do
        allow(Experiences::Visibility).to receive(:payload_for_user)
          .and_raise(StandardError.new("Visibility error"))
      end

      it "handles visibility service errors gracefully" do
        expect { broadcaster.broadcast_experience_update }.not_to raise_error
      end
    end
  end

  describe ".trigger_resubscription_for_participant" do
    let!(:participant) do
      create(:experience_participant, experience: experience, role: :host)
    end

    it "broadcasts resubscription message to participant stream" do
      expect(ActionCable.server).to receive(:broadcast).with(
        "experience_#{experience.id}_participant_#{participant.id}",
        hash_including(
          type: 'resubscribe_required',
          participant_id: participant.id,
          reason: 'segments_changed'
        )
      )

      described_class.trigger_resubscription_for_participant(participant)
    end
  end
end
