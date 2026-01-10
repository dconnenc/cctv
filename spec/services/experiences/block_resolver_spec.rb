require "rails_helper"

RSpec.describe Experiences::BlockResolver do
  let(:experience) { create(:experience, status: :live) }
  let(:user) { create(:user, :user) }
  let!(:participant) do
    create(:experience_participant, user: user, experience: experience, role: :player)
  end

  describe ".next_unresolved_child" do
    subject do
      described_class.next_unresolved_child(
        block: parent_block,
        participant: participant
      )
    end

    context "with a Family Feud block containing multiple questions" do
      let!(:parent_block) do
        create(
          :experience_block,
          :family_feud,
          experience: experience,
          status: :open,
          question_count: 2
        )
      end

      let!(:question_1) { parent_block.child_blocks.order(:position).first }
      let!(:question_2) { parent_block.child_blocks.order(:position).second }

      context "when no questions have been answered" do
        it "returns the first question" do
          expect(subject).to eq(question_1)
        end
      end

      context "when the first question has been answered" do
        before do
          Experiences::Orchestrator.new(
            actor: user,
            experience: experience
          ).submit_question_response!(
            block_id: question_1.id,
            answer: { "value" => "My answer to question 1" }
          )
        end

        it "returns the second question" do
          expect(subject).to eq(question_2)
        end
      end

      context "when all questions have been answered" do
        before do
          orchestrator = Experiences::Orchestrator.new(
            actor: user,
            experience: experience
          )
          
          orchestrator.submit_question_response!(
            block_id: question_1.id,
            answer: { "value" => "Answer 1" }
          )
          orchestrator.submit_question_response!(
            block_id: question_2.id,
            answer: { "value" => "Answer 2" }
          )
        end

        it "returns nil" do
          expect(subject).to be_nil
        end
      end

      context "when questions are answered out of order" do
        before do
          Experiences::Orchestrator.new(
            actor: user,
            experience: experience
          ).submit_question_response!(
            block_id: question_2.id,
            answer: { "value" => "Answer 2" }
          )
        end

        it "still returns the first unanswered question (question 1)" do
          expect(subject).to eq(question_1)
        end
      end
    end

    context "with a parent block that has no children" do
      let(:parent_block) do
        create(:experience_block, experience: experience, status: :open)
      end

      it "returns nil" do
        expect(subject).to be_nil
      end
    end
  end
end
