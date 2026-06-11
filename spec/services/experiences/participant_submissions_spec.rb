require "rails_helper"

RSpec.describe Experiences::ParticipantSubmissions do
  let(:experience) { create(:experience, status: :live) }
  let(:participant) { create(:experience_participant, :audience, experience: experience) }

  subject(:entries) { described_class.new(experience).for_participant(participant.id) }

  describe "#for_participant" do
    context "with a regular poll block" do
      let!(:poll_block) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::POLL,
          payload: { "question" => "Favourite colour?", "options" => ["Red", "Blue"], "pollType" => "single" },
          position: 0)
      end

      before do
        ExperiencePollSubmission.create!(
          experience_block: poll_block,
          experience_participant: participant,
          answer: { "selectedOptions" => ["Red"] }
        )
      end

      it "includes the poll submission as a clue" do
        expect(entries.map { |e| e[:prompt] }).to include("Favourite colour?")
      end
    end

    context "with a Guess Who T/F poll block (child of a guess_who block)" do
      let!(:guess_who_block) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::GUESS_WHO,
          payload: {}, position: 0)
      end

      let!(:tf_poll_block) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::POLL,
          parent_block: guess_who_block,
          payload: {
            "question" => "True or False?",
            "options" => ["True", "False"],
            "pollType" => "single",
            "guess_who_parent_id" => guess_who_block.id
          },
          position: 1)
      end

      before do
        ExperiencePollSubmission.create!(
          experience_block: tf_poll_block,
          experience_participant: participant,
          answer: { "selectedOptions" => ["True"] }
        )
      end

      it "excludes the Guess Who T/F poll from clues" do
        expect(entries.map { |e| e[:prompt] }).not_to include("True or False?")
      end

      it "returns an empty list when that is the only submission" do
        expect(entries).to be_empty
      end
    end

    context "with both a regular poll and a Guess Who T/F poll" do
      let!(:guess_who_block) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::GUESS_WHO,
          payload: {}, position: 0)
      end

      let!(:tf_poll_block) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::POLL,
          parent_block: guess_who_block,
          payload: {
            "question" => "True or False?",
            "options" => ["True", "False"],
            "pollType" => "single",
            "guess_who_parent_id" => guess_who_block.id
          },
          position: 1)
      end

      let!(:regular_poll_block) do
        create(:experience_block, experience: experience, kind: ExperienceBlock::POLL,
          payload: { "question" => "Best pizza topping?", "options" => ["Pepperoni", "Mushroom"], "pollType" => "single" },
          position: 2)
      end

      before do
        ExperiencePollSubmission.create!(
          experience_block: tf_poll_block,
          experience_participant: participant,
          answer: { "selectedOptions" => ["True"] }
        )
        ExperiencePollSubmission.create!(
          experience_block: regular_poll_block,
          experience_participant: participant,
          answer: { "selectedOptions" => ["Pepperoni"] }
        )
      end

      it "includes only the regular poll submission" do
        prompts = entries.map { |e| e[:prompt] }
        expect(prompts).to include("Best pizza topping?")
        expect(prompts).not_to include("True or False?")
      end
    end
  end
end
