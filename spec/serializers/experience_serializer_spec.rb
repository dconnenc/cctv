require "rails_helper"

RSpec.describe ExperienceSerializer do
  let(:experience) { create(:experience) }

  describe ".serialize_experience" do
    context "with a visibility payload" do
      let(:block) { create(:experience_block, experience: experience) }
      let(:visibility_payload) do
        {
          experience: {
            id: experience.id,
            blocks: [{ id: block.id, kind: block.kind }],
            next_block: nil
          }
        }
      end

      it "includes blocks from the visibility payload" do
        result = described_class.serialize_experience(
          experience, visibility_payload: visibility_payload
        )

        expect(result[:blocks].first[:id]).to eq(block.id)
      end

      context "when the payload includes participant_block_active" do
        before { visibility_payload[:experience][:participant_block_active] = true }

        it "includes participant_block_active in the result" do
          result = described_class.serialize_experience(
            experience, visibility_payload: visibility_payload
          )

          expect(result[:participant_block_active]).to be true
        end
      end

      context "when the payload does not include participant_block_active" do
        it "omits participant_block_active from the result" do
          result = described_class.serialize_experience(
            experience, visibility_payload: visibility_payload
          )

          expect(result).not_to have_key(:participant_block_active)
        end
      end
    end
  end
end
