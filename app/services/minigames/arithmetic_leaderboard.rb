module Minigames
  class ArithmeticLeaderboard
    def self.compute(block:)
      new(block: block).compute
    end

    def initialize(block:)
      @block = block
    end

    def compute
      submissions = ExperienceMinigameSubmission
        .where(experience_block_id: @block.id)
        .order(submitted_at: :asc)

      grouped = submissions.group_by(&:user_id)

      participants_by_user_id = @block.experience.experience_participants
        .includes(:user)
        .index_by(&:user_id)

      entries = grouped.map do |user_id, user_submissions|
        participant = participants_by_user_id[user_id]
        next nil unless participant

        correct = user_submissions.count(&:correct)
        last_submitted_at = user_submissions.last.submitted_at

        {
          "participant_id" => participant.id,
          "user_id"        => user_id,
          "name"           => participant.name,
          "avatar"         => participant.avatar.presence,
          "correct"        => correct,
          "completed"      => user_submissions.size,
          "last_submitted_at" => last_submitted_at
        }
      end.compact

      ranked = entries.sort_by.with_index { |e, i| [-e["correct"], i] }

      assign_ranks(ranked)
    end

    private

    def assign_ranks(entries)
      previous_correct = nil
      previous_rank    = 0

      entries.each_with_index do |entry, index|
        if entry["correct"] == previous_correct
          entry["rank"] = previous_rank
        else
          entry["rank"]    = index + 1
          previous_rank    = entry["rank"]
          previous_correct = entry["correct"]
        end
      end

      entries
    end
  end
end
