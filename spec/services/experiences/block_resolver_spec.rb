require "rails_helper"

RSpec.describe Experiences::BlockResolver do
  let(:experience) { create(:experience, status: :live) }
  let(:user) { create(:user, :user) }
  let!(:participant) { create(:experience_participant, user: user, experience: experience, role: :player) }

  describe ".next_unresolved_child" do
    let!(:parent) { create(:experience_block, experience: experience, kind: :question, status: :open, position: 0) }

    context "when the parent has no dependencies" do
      it "returns nil" do
        result = described_class.next_unresolved_child(block: parent, participant: participant)
        expect(result).to be_nil
      end
    end

    context "when the parent has children" do
      let!(:child1) do
        create(:experience_block, experience: experience, kind: :question, status: :open,
               parent_block: parent, position: 0)
      end
      let!(:child2) do
        create(:experience_block, experience: experience, kind: :question, status: :open,
               parent_block: parent, position: 1)
      end

      before do
        create(:experience_block_link, parent_block: parent, child_block: child1)
        create(:experience_block_link, parent_block: parent, child_block: child2)
      end

      it "returns the first child when none are answered" do
        result = described_class.next_unresolved_child(block: parent, participant: participant)
        expect(result).to eq(child1)
      end

      it "skips children the participant has already responded to" do
        create(:experience_question_submission,
               experience_block: child1, user: user, answer: { "value" => "answered" })

        result = described_class.next_unresolved_child(block: parent, participant: participant)
        expect(result).to eq(child2)
      end

      it "returns nil when all children are answered" do
        create(:experience_question_submission,
               experience_block: child1, user: user, answer: { "value" => "a1" })
        create(:experience_question_submission,
               experience_block: child2, user: user, answer: { "value" => "a2" })

        result = described_class.next_unresolved_child(block: parent, participant: participant)
        expect(result).to be_nil
      end
    end

    context "with a submissions_cache" do
      let!(:child) do
        create(:experience_block, experience: experience, kind: :question, status: :open,
               parent_block: parent, position: 0)
      end

      before { create(:experience_block_link, parent_block: parent, child_block: child) }

      it "uses the cache instead of querying the DB" do
        submission = build(:experience_question_submission, experience_block: child, user: user)
        cache = { child.id => { user.id => submission } }

        result = described_class.next_unresolved_child(
          block: parent, participant: participant, submissions_cache: cache
        )
        expect(result).to be_nil
      end
    end

    context "child visibility" do
      let!(:closed_child) do
        create(:experience_block, experience: experience, kind: :question, status: :closed,
               parent_block: parent, position: 0)
      end
      let!(:open_child) do
        create(:experience_block, experience: experience, kind: :question, status: :open,
               parent_block: parent, position: 1)
      end

      before do
        create(:experience_block_link, parent_block: parent, child_block: closed_child)
        create(:experience_block_link, parent_block: parent, child_block: open_child)
      end

      it "skips closed children" do
        result = described_class.next_unresolved_child(block: parent, participant: participant)
        expect(result).to eq(open_child)
      end

      context "when child has role targeting" do
        let!(:player_only_child) do
          create(:experience_block, experience: experience, kind: :question, status: :open,
                 parent_block: parent, position: 2, visible_to_roles: ["audience"])
        end

        before { create(:experience_block_link, parent_block: parent, child_block: player_only_child) }

        it "skips children that don't match the participant's role" do
          result = described_class.next_unresolved_child(block: parent, participant: participant)
          expect(result).to eq(open_child)
        end
      end
    end

    context "when participant is a host" do
      let!(:host_participant) do
        create(:experience_participant, user: create(:user, :user), experience: experience, role: :host)
      end
      let!(:closed_child) do
        create(:experience_block, experience: experience, kind: :question, status: :closed,
               parent_block: parent, position: 0)
      end

      before { create(:experience_block_link, parent_block: parent, child_block: closed_child) }

      it "can see closed children" do
        result = described_class.next_unresolved_child(block: parent, participant: host_participant)
        expect(result).to eq(closed_child)
      end
    end
  end

  describe ".resolve_variables" do
    context "when block has no dependencies" do
      let!(:block) { create(:experience_block, experience: experience, kind: :announcement, status: :open) }

      it "returns empty hash" do
        result = described_class.resolve_variables(block: block, participant: participant)
        expect(result).to eq({})
      end
    end

    context "when block has dependencies but no variables" do
      let!(:mad_lib_block) { create(:experience_block, experience: experience, kind: :mad_lib, status: :open) }
      let!(:child) { create(:experience_block, experience: experience, kind: :question, status: :open, parent_block: mad_lib_block) }

      before { create(:experience_block_link, parent_block: mad_lib_block, child_block: child) }

      it "returns empty hash" do
        result = described_class.resolve_variables(block: mad_lib_block, participant: participant)
        expect(result).to eq({})
      end
    end
  end
end
