require "rails_helper"

RSpec.describe ExperienceBlock do
  let(:experience) { create(:experience) }

  describe "position validations" do
    context "when the block is a parent" do
      before do
        create(:experience_block, experience: experience, position: 0)
      end

      it "enforces unique position within experience" do
        expect {
          create(:experience_block, experience: experience, position: 0)
        }.to raise_error(ActiveRecord::RecordNotUnique)
      end
    end

    context "when there are children with the same position" do
      let(:child1) do
        build(
          :experience_block,
          experience: experience,
          parent_block: parent1,
          position: 0
        )
      end

      let(:child2) do
        build(
          :experience_block,
          experience: experience,
          parent_block: parent2,
          position: 0
        )
      end

      context "with different parents" do
        let(:parent1) { create(:experience_block, experience: experience) }
        let(:parent2) { create(:experience_block, experience: experience) }

        it "is valid" do
          expect(child1).to be_valid
          expect(child2).to be_valid
        end
      end

      context "with the same parents" do
        let(:parent1) { create(:experience_block, experience: experience) }
        let(:parent2) { parent1 }

        it "enforces unique position within parent" do
          child1.save!

          expect {
            child2.save!
          }.to raise_error(ActiveRecord::RecordNotUnique)
        end
      end
    end
  end

  describe "#next_sibling" do
    context "for parent blocks" do
      let!(:block1) { create(:experience_block, experience: experience, position: 0) }
      let!(:block2) { create(:experience_block, experience: experience, position: 1) }
      let!(:block3) { create(:experience_block, experience: experience, position: 2) }

      it "returns next parent block by position" do
        expect(block1.next_sibling).to eq(block2)
        expect(block2.next_sibling).to eq(block3)
      end

      it "returns nil for last block" do
        expect(block3.next_sibling).to be_nil
      end
    end

    context "for child blocks" do
      let(:parent) { create(:experience_block, experience: experience) }
      let!(:child1) { create(:experience_block, experience: experience, parent_block: parent, position: 0) }
      let!(:child2) { create(:experience_block, experience: experience, parent_block: parent, position: 1) }

      it "returns next child block within same parent" do
        expect(child1.next_sibling).to eq(child2)
      end

      it "returns nil for last child" do
        expect(child2.next_sibling).to be_nil
      end
    end
  end

  describe "#previous_sibling" do
    context "for parent blocks" do
      let!(:block1) { create(:experience_block, experience: experience, position: 0) }
      let!(:block2) { create(:experience_block, experience: experience, position: 1) }

      it "returns previous parent block by position" do
        expect(block2.previous_sibling).to eq(block1)
      end

      it "returns nil for first block" do
        expect(block1.previous_sibling).to be_nil
      end
    end
  end

  describe "#parent_block?" do
    context "when block has no parent" do
      let(:block) { create(:experience_block, experience: experience) }

      it "returns true" do
        expect(block.parent_block?).to be true
      end
    end

    context "when block has a parent" do
      let(:parent) { create(:experience_block, experience: experience) }
      let(:child) { create(:experience_block, experience: experience, parent_block: parent) }

      it "returns false" do
        expect(child.parent_block?).to be false
      end
    end
  end

  describe "#child_block?" do
    context "when block has no parent" do
      let(:block) { create(:experience_block, experience: experience) }

      it "returns false" do
        expect(block.child_block?).to be false
      end
    end

    context "when block has a parent" do
      let(:parent) { create(:experience_block, experience: experience) }
      let(:child) { create(:experience_block, experience: experience, parent_block: parent) }

      it "returns true" do
        expect(child.child_block?).to be true
      end
    end
  end

  describe "#siblings" do
    context "for parent blocks" do
      let!(:block1) { create(:experience_block, experience: experience) }
      let!(:block2) { create(:experience_block, experience: experience) }
      let!(:block3) { create(:experience_block, experience: experience) }

      it "returns other parent blocks in the same experience" do
        expect(block1.siblings).to contain_exactly(block2, block3)
      end
    end

    context "for child blocks" do
      let(:parent) { create(:experience_block, experience: experience) }
      let!(:child1) { create(:experience_block, experience: experience, parent_block: parent) }
      let!(:child2) { create(:experience_block, experience: experience, parent_block: parent) }
      let!(:child3) { create(:experience_block, experience: experience, parent_block: parent) }

      it "returns other children of the same parent" do
        expect(child1.siblings).to contain_exactly(child2, child3)
      end
    end
  end

  describe "#open!" do
    context "when opening a family feud block with nested children" do
      let!(:parent) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::FAMILY_FEUD,
          status: :hidden
        )
      end

      let!(:child1) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::QUESTION,
          status: :hidden,
          parent_block_id: parent.id
        )
      end

      let!(:child2) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::QUESTION,
          status: :hidden,
          parent_block_id: parent.id
        )
      end

      let!(:grandchild) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::POLL,
          status: :hidden,
          parent_block_id: child1.id
        )
      end

      it "opens the parent and all descendants recursively" do
        parent.open!

        expect(parent.reload.status).to eq("open")
        expect(child1.reload.status).to eq("open")
        expect(child2.reload.status).to eq("open")
        expect(grandchild.reload.status).to eq("open")
      end
    end
  end

  describe "#close!" do
    context "when closing a block with nested children" do
      let!(:parent) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::POLL,
          status: :open
        )
      end

      let!(:child1) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::QUESTION,
          status: :open,
          parent_block_id: parent.id
        )
      end

      let!(:child2) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::QUESTION,
          status: :open,
          parent_block_id: parent.id
        )
      end

      let!(:grandchild) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::POLL,
          status: :open,
          parent_block_id: child1.id
        )
      end

      it "closes the parent and all descendants recursively" do
        parent.close!

        expect(parent.reload.status).to eq("closed")
        expect(child1.reload.status).to eq("closed")
        expect(child2.reload.status).to eq("closed")
        expect(grandchild.reload.status).to eq("closed")
      end
    end
  end

  describe "#hide!" do
    context "when hiding a block with nested children" do
      let!(:parent) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::POLL,
          status: :open
        )
      end

      let!(:child1) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::QUESTION,
          status: :open,
          parent_block_id: parent.id
        )
      end

      let!(:child2) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::QUESTION,
          status: :open,
          parent_block_id: parent.id
        )
      end

      let!(:grandchild) do
        create(
          :experience_block,
          experience: experience,
          kind: ExperienceBlock::POLL,
          status: :open,
          parent_block_id: child1.id
        )
      end

      it "hides the parent and all descendants recursively" do
        parent.hide!

        expect(parent.reload.status).to eq("hidden")
        expect(child1.reload.status).to eq("hidden")
        expect(child2.reload.status).to eq("hidden")
        expect(grandchild.reload.status).to eq("hidden")
      end
    end
  end
end
