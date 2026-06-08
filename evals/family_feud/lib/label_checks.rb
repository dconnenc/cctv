# frozen_string_literal: true

require "set"

module FamilyFeudEval
  # Tier 2 (cheap, deterministic half): catches the obvious label offenders for
  # free, before spending an LLM-judge call. Pure functions, no API.
  #   - generic / grab-bag names ("Other", "Misc", "Various", "Stuff")
  #   - names longer than the 1-4 word house rule
  #   - near-duplicate names ("too close together" at the label level)
  module LabelChecks
    GENERIC_WORDS = %w[
      other others misc miscellaneous various general generic stuff things
      etc assorted random uncategorized unsorted everything anything else
    ].to_set

    STOPWORDS = %w[the a an of to my your his her their and or for in on with].to_set

    NEAR_DUPLICATE_JACCARD = 0.6
    MAX_WORDS = 4

    module_function

    def check(pred)
      names = (pred || []).map { |b| b["name"].to_s.strip }.reject(&:empty?)

      generic = names.select { |n| generic?(n) }
      too_long = names.select { |n| word_count(n) > MAX_WORDS }
      near_dupes = near_duplicate_pairs(names)

      {
        "generic_names" => generic,
        "generic_count" => generic.length,
        "too_long_names" => too_long,
        "too_long_count" => too_long.length,
        "near_duplicate_pairs" => near_dupes,
        "near_duplicate_count" => near_dupes.length,
        "violation_count" => generic.length + too_long.length + near_dupes.length
      }
    end

    def generic?(name)
      tokens = significant_tokens(name)
      return true if tokens.empty?

      tokens.all? { |t| GENERIC_WORDS.include?(t) } ||
        tokens.any? { |t| %w[other misc miscellaneous various].include?(t) }
    end

    def near_duplicate_pairs(names)
      pairs = []
      names.combination(2).each do |a, b|
        ta = significant_tokens(a).to_set
        tb = significant_tokens(b).to_set
        next if ta.empty? || tb.empty?

        jaccard = (ta & tb).size.to_f / (ta | tb).size
        pairs << [a, b] if jaccard >= NEAR_DUPLICATE_JACCARD
      end
      pairs
    end

    def word_count(name)
      name.split(/\s+/).reject(&:empty?).length
    end

    def significant_tokens(name)
      name.downcase.delete("'").scan(/[a-z0-9]+/).reject { |t| STOPWORDS.include?(t) }
    end
  end
end
