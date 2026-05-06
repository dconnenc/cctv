module TheScene
  # Ranks the active suggestions for a block by current-scene vote count.
  # Suggestions with zero votes are included at the tail in submission order
  # so the leaderboard renders deterministically before any votes arrive.
  class Tally
    Entry = Struct.new(:suggestion, :vote_count, :rank, keyword_init: true)

    def self.full(block:, scene_started_at:)
      new(block: block, scene_started_at: scene_started_at).full
    end

    def self.top(block:, scene_started_at:, limit: 1)
      full(block: block, scene_started_at: scene_started_at).first(limit).map(&:suggestion)
    end

    def initialize(block:, scene_started_at:)
      @block            = block
      @scene_started_at = scene_started_at
    end

    def full
      suggestions = TheScene::Shortlist.active_for(block: @block).to_a
      counts      = vote_counts

      ranked = suggestions
        .map { |s| { suggestion: s, vote_count: counts[s.id].to_i } }
        .sort_by.with_index { |entry, idx| [-entry[:vote_count], idx] }

      assign_ranks(ranked).map { |e| Entry.new(**e) }
    end

    private

    def vote_counts
      return {} if @scene_started_at.blank?

      ImprovVote
        .where(experience_block_id: @block.id, scene_started_at: @scene_started_at)
        .group(:improv_suggestion_id)
        .count
    end

    def assign_ranks(entries)
      previous_count = nil
      previous_rank  = 0

      entries.each_with_index do |entry, index|
        if entry[:vote_count] == previous_count
          entry[:rank] = previous_rank
        else
          entry[:rank]    = index + 1
          previous_rank   = entry[:rank]
          previous_count  = entry[:vote_count]
        end
      end

      entries
    end
  end
end
