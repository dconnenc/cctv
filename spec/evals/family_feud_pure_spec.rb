# frozen_string_literal: true

require "spec_helper"

# Pure-function tests for the Family Feud eval harness (Tier 1 metrics, the
# deterministic fixture generator, and Tier 2 label checks). No API, no Rails —
# CI-safe. The API-hitting runner lives in evals/ and is deliberately not tested
# here (it is an on-demand scorecard, not a gate).
require_relative "../../evals/family_feud/lib/expand"
require_relative "../../evals/family_feud/lib/metrics"
require_relative "../../evals/family_feud/lib/label_checks"

RSpec.describe "FamilyFeudEval pure functions" do
  let(:gold) do
    { "groups" => { "G1" => %w[a b], "G2" => %w[c d e] }, "unassigned" => %w[x y] }
  end
  let(:all_ids) { %w[a b c d e x y] }

  def score(pred)
    FamilyFeudEval::Metrics.score(gold: gold, pred: pred, all_ids: all_ids)
  end

  describe FamilyFeudEval::Metrics do
    it "scores a perfect partition as 1.0 across the board" do
      r = score([{ "name" => "G1", "answer_ids" => %w[a b] },
                 { "name" => "G2", "answer_ids" => %w[c d e] }])
      expect(r["pairwise_f1"]).to eq(1.0)
      expect(r["homogeneity"]).to eq(1.0)
      expect(r["completeness"]).to eq(1.0)
      expect(r["unassigned_precision"]).to eq(1.0)
      expect(r["unassigned_recall"]).to eq(1.0)
      expect(r["bucket_count_delta"]).to eq(0)
    end

    it "flags over-merge via pairwise precision (not recall)" do
      r = score([{ "name" => "Merged", "answer_ids" => %w[a b c d e] }])
      expect(r["pairwise_precision"]).to eq(0.4)
      expect(r["pairwise_recall"]).to eq(1.0)
      expect(r["over_merge"]).to eq(0.6)
      expect(r["completeness"]).to eq(1.0)
      expect(r["homogeneity"]).to be < 1.0
    end

    it "flags over-split via pairwise recall (not precision)" do
      r = score([{ "name" => "G1", "answer_ids" => %w[a b] },
                 { "name" => "G2a", "answer_ids" => %w[c d] },
                 { "name" => "G2b", "answer_ids" => %w[e] }])
      expect(r["pairwise_precision"]).to eq(1.0)
      expect(r["pairwise_recall"]).to eq(0.5)
      expect(r["over_split"]).to eq(0.5)
      expect(r["homogeneity"]).to eq(1.0)
      expect(r["completeness"]).to be < 1.0
      expect(r["bucket_count_delta"]).to eq(1)
    end

    it "catches the 'Other' grab-bag via unassigned_recall and precision" do
      r = score([{ "name" => "G1", "answer_ids" => %w[a b] },
                 { "name" => "G2", "answer_ids" => %w[c d e] },
                 { "name" => "Other", "answer_ids" => %w[x y] }])
      expect(r["unassigned_recall"]).to eq(0.0)
      expect(r["pairwise_precision"]).to eq(0.8)
    end

    it "treats an empty prediction as vacuously precise but zero recall" do
      r = score([])
      expect(r["pairwise_precision"]).to eq(1.0)
      expect(r["pairwise_recall"]).to eq(0.0)
      expect(r["bucket_count"]).to eq(0)
    end

    it "filters unknown ids and dedupes (first bucket wins) like production" do
      r = score([{ "name" => "G1", "answer_ids" => %w[a b zzz] },
                 { "name" => "Dup", "answer_ids" => %w[a c d e] }])
      expect(r["pairwise_precision"]).to eq(1.0)
      expect(r["pairwise_recall"]).to eq(1.0)
    end

    describe ".cap_buckets" do
      def bucket(name, size)
        { "name" => name, "answer_ids" => Array.new(size) { |i| "#{name}-#{i}" } }
      end

      it "leaves boards of 8 or fewer buckets untouched" do
        buckets = Array.new(8) { |i| bucket("b#{i}", 2) }
        expect(described_class.cap_buckets(buckets, max: 8)).to eq(buckets)
      end

      it "keeps the 8 largest buckets and drops the overflow (which becomes unassigned)" do
        sizes = [5, 4, 3, 2, 1, 5, 4, 3, 2, 1]
        buckets = sizes.each_with_index.map { |s, i| bucket("b#{i}", s) }
        capped = described_class.cap_buckets(buckets, max: 8)

        expect(capped.length).to eq(8)
        names = capped.map { |b| b["name"] }
        expect(names).not_to include("b4", "b9") # the two smallest (size 1)
        expect(names).to eq(%w[b0 b1 b2 b3 b5 b6 b7 b8]) # original order preserved
      end
    end
  end

  describe FamilyFeudEval::Expand do
    let(:source) do
      {
        "id" => "demo-q", "season" => "S99", "question" => "Name a thing.", "target_n" => 14,
        "difficulty_tags" => %w[paraphrase singleton off_topic],
        "groups" => [
          { "label" => "Apples", "weight" => 50, "variants" => ["apple", "an apple", "red apple"] },
          { "label" => "Bananas", "weight" => 30, "variants" => ["banana", "a banana"] },
          { "label" => "Cherries", "weight" => 10, "variants" => %w[cherry cherries] }
        ],
        "singletons" => ["a durian"],
        "junk" => ["lol idk", "your mom"]
      }
    end

    it "is deterministic across regenerations" do
      expect(described_class.fixture_from_source(source)).to eq(described_class.fixture_from_source(source))
    end

    it "produces a gold partition covering every raw id exactly once" do
      fx = described_class.fixture_from_source(source)
      ids = fx["raw_responses"].map { |r| r["id"] }
      gold_ids = fx["gold"]["groups"].values.flatten + fx["gold"]["unassigned"]
      expect(ids.uniq).to match_array(ids)
      expect(gold_ids).to match_array(ids)
    end

    it "gives every named group at least two members and routes singletons+junk to unassigned" do
      fx = described_class.fixture_from_source(source)
      expect(fx["gold"]["groups"].values).to all(satisfy { |v| v.length >= 2 })
      expect(fx["gold"]["unassigned"].length).to eq(3)
    end

    it "produces fixtures a perfect prediction scores 1.0 on" do
      fx = described_class.fixture_from_source(source)
      ids = fx["raw_responses"].map { |r| r["id"] }
      pred = fx["gold"]["groups"].map { |label, gids| { "name" => label, "answer_ids" => gids } }
      r = FamilyFeudEval::Metrics.score(gold: fx["gold"], pred: pred, all_ids: ids)
      expect(r["pairwise_f1"]).to eq(1.0)
      expect(r["unassigned_recall"]).to eq(1.0)
    end
  end

  describe FamilyFeudEval::LabelChecks do
    subject(:result) do
      described_class.check([{ "name" => "Other" }, { "name" => "Various Things" },
                             { "name" => "Mom's Cooking" }, { "name" => "Moms Cooking" },
                             { "name" => "A Really Very Long Name Here" }])
    end

    it "flags generic / grab-bag names" do
      expect(result["generic_names"]).to include("Other", "Various Things")
    end

    it "does not flag a sharp, specific name" do
      expect(result["generic_names"]).not_to include("Mom's Cooking")
    end

    it "flags near-duplicate names across apostrophe/spelling noise" do
      expect(result["near_duplicate_count"]).to be >= 1
    end

    it "flags names longer than the 1-4 word rule" do
      expect(result["too_long_names"]).to include("A Really Very Long Name Here")
    end
  end
end
