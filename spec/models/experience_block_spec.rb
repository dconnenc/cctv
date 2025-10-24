require "rails_helper"

RSpec.describe ExperienceBlock do
  let(:experience) { create(:experience) }
  
  describe "position validations" do
    context "for parent blocks" do
      it "enforces unique position within experience" do
        block1 = create(:experience_block, experience: experience, position: 0)
        
        expect {
          create(:experience_block, experience: experience, position: 0)
        }.to raise_error(ActiveRecord::RecordNotUnique)
      end
    end
    
    context "for child blocks" do
      let(:parent1) { create(:experience_block, experience: experience) }
      let(:parent2) { create(:experience_block, experience: experience) }
      
      it "allows same position for children of different parents" do
        child1 = create(:experience_block, experience: experience, parent_block: parent1, position: 0)
        child2 = create(:experience_block, experience: experience, parent_block: parent2, position: 0)
        
        expect(child1).to be_valid
        expect(child2).to be_valid
      end
      
      it "enforces unique position within parent" do
        create(:experience_block, experience: experience, parent_block: parent1, position: 5)
        
        expect {
          create(:experience_block, experience: experience, parent_block: parent1, position: 5)
        }.to raise_error(ActiveRecord::RecordNotUnique)
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
end