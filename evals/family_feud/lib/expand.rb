# frozen_string_literal: true

module FamilyFeudEval
  # Deterministic expansion of a compact, hand-authored fixture "source" into a
  # frozen eval fixture. The creative input (question, board, variant phrasings,
  # junk) is authored by a non-Gemini model so the model under test never grades
  # its own paraphrases. The expansion itself is pure and seedless-deterministic,
  # so regenerating yields byte-identical fixtures.
  #
  # Source shape (fixtures_src/*.json):
  #   {
  #     "id": "feud18-pig-spouse",
  #     "season": "S18",
  #     "question": "Name something your spouse does like a pig.",
  #     "target_n": 18,
  #     "difficulty_tags": ["paraphrase", "near_miss", "off_topic", "singleton"],
  #     "groups": [
  #       { "label": "Snores", "weight": 39,
  #         "variants": ["snores loudly", "saws logs", "he snores all night"] },
  #       ...
  #     ],
  #     "singletons": ["wallows in self pity"],   # lone real ideas -> unassigned
  #     "junk": ["i love bacon", "oink oink lol"] # off-topic/jokes  -> unassigned
  #   }
  #
  # Frozen fixture shape (fixtures/*.json):
  #   {
  #     "id", "season", "question", "difficulty_tags",
  #     "board": [{ "label", "points" }],
  #     "raw_responses": [{ "id", "text" }],          # shuffled
  #     "gold": { "groups": { label => [ids] }, "unassigned": [ids] }
  #   }
  module Expand
    UNASSIGNED = "__unassigned__"
    MIN_PER_GROUP = 2

    module_function

    def fixture_from_source(src)
      id = src.fetch("id")
      groups = src.fetch("groups")
      singletons = src["singletons"] || []
      junk = src["junk"] || []
      target_n = src.fetch("target_n")

      counts = allocate_counts(groups, singletons.length + junk.length, target_n)
      items = build_items(id, groups, counts, singletons, junk)

      rng = Lcg.new(string_seed(id))
      shuffled = deterministic_shuffle(items, rng)

      gold_groups = {}
      unassigned = []
      shuffled.each do |it|
        if it[:gold] == UNASSIGNED
          unassigned << it[:id]
        else
          (gold_groups[it[:gold]] ||= []) << it[:id]
        end
      end

      {
        "id" => id,
        "season" => src["season"],
        "question" => src.fetch("question"),
        "difficulty_tags" => src["difficulty_tags"] || [],
        "board" => groups.map { |g| { "label" => g.fetch("label"), "points" => g["weight"] } },
        "raw_responses" => shuffled.map { |it| { "id" => it[:id], "text" => it[:text] } },
        "gold" => {
          "groups" => gold_groups,
          "unassigned" => unassigned
        }
      }
    end

    # Largest-remainder allocation of the group budget across weights, with a
    # floor of MIN_PER_GROUP so every named board answer becomes a real (>=2)
    # bucket rather than a lone-item bucket the prompt would (correctly) drop.
    def allocate_counts(groups, reserved, target_n)
      n = groups.length
      return [] if n.zero?

      group_budget = [target_n - reserved, n * MIN_PER_GROUP].max
      base = Array.new(n, MIN_PER_GROUP)
      remaining = group_budget - (n * MIN_PER_GROUP)
      return base if remaining <= 0

      weights = groups.map { |g| g.fetch("weight").to_f }
      total = weights.sum
      raw = weights.map { |w| remaining * (w / total) }
      base = base.each_with_index.map { |b, i| b + raw[i].floor }

      leftover = remaining - raw.sum(&:floor)
      order = raw.each_index.sort_by { |i| [-(raw[i] - raw[i].floor), i] }
      leftover.times { |k| base[order[k % n]] += 1 }
      base
    end

    def build_items(id, groups, counts, singletons, junk)
      items = []
      seq = 0
      groups.each_with_index do |g, gi|
        label = g.fetch("label")
        variants = g.fetch("variants")
        counts[gi].times do |k|
          items << { id: "#{id}-#{seq}", text: variants[k % variants.length], gold: label }
          seq += 1
        end
      end
      (singletons + junk).each do |text|
        items << { id: "#{id}-#{seq}", text: text, gold: UNASSIGNED }
        seq += 1
      end
      items
    end

    def string_seed(str)
      str.to_s.bytes.reduce(7) { |acc, b| (acc * 31 + b) % 2_147_483_647 }
    end

    def deterministic_shuffle(arr, rng)
      a = arr.dup
      (a.length - 1).downto(1) do |i|
        j = rng.next_int(i + 1)
        a[i], a[j] = a[j], a[i]
      end
      a
    end

    # Park-Miller minimal standard LCG. Pure and reproducible across machines.
    class Lcg
      def initialize(seed)
        @state = seed % 2_147_483_647
        @state = 1 if @state <= 0
      end

      def next_int(max)
        @state = (@state * 16_807) % 2_147_483_647
        @state % max
      end
    end
  end
end
