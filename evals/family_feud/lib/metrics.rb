# frozen_string_literal: true

require "set"

module FamilyFeudEval
  # Tier 1: deterministic partition-quality metrics. Pure functions, no API, no
  # Rails. These lead the iteration loop because they isolate the two demo
  # failures numerically:
  #   - over-merge ("too close together") -> pairwise precision drops
  #   - over-split                        -> pairwise recall drops
  #   - the "Other" grab-bag failure      -> unassigned_recall drops
  #
  # `gold`  => { "groups" => { label => [ids] }, "unassigned" => [ids] }
  # `pred`  => [{ "name" => String, "answer_ids" => [ids] }, ...]  (model output)
  # `all_ids` => every raw_response id in the fixture
  module Metrics
    UNASSIGNED = "__unassigned__"

    module_function

    def score(gold:, pred:, all_ids:)
      all = all_ids.to_a
      id_set = all.to_set

      # Mirror production filtering: keep only known ids, dedup, first-bucket-wins.
      pred_groups = normalize_pred(pred, id_set)
      pred_assigned = pred_groups.flatten.to_set
      pred_unassigned = id_set - pred_assigned

      gold_named = gold.fetch("groups").transform_values(&:to_a)
      gold_unassigned = (gold["unassigned"] || []).to_set

      pw = pairwise(gold_named.values, pred_groups)
      vm = v_measure(class_map(gold_named, gold_unassigned, all),
                     cluster_map(pred_groups, pred_unassigned, all))
      ua = unassigned_scores(pred_unassigned, gold_unassigned)

      {
        "pairwise_precision" => pw[:precision],
        "pairwise_recall" => pw[:recall],
        "pairwise_f1" => pw[:f1],
        "over_merge" => round1(1.0 - pw[:precision]),
        "over_split" => round1(1.0 - pw[:recall]),
        "homogeneity" => vm[:homogeneity],
        "completeness" => vm[:completeness],
        "v_measure" => vm[:v_measure],
        "unassigned_precision" => ua[:precision],
        "unassigned_recall" => ua[:recall],
        "bucket_count" => pred_groups.length,
        "gold_bucket_count" => gold_named.length,
        "bucket_count_delta" => pred_groups.length - gold_named.length
      }
    end

    # First-bucket-wins on duplicate ids, drop unknown ids, drop empty buckets.
    def normalize_pred(pred, id_set)
      seen = Set.new
      (pred || []).filter_map do |b|
        ids = (b["answer_ids"] || []).select { |i| id_set.include?(i) && seen.add?(i) }
        ids unless ids.empty?
      end
    end

    def pairwise(gold_groups, pred_groups)
      gold_pairs = pair_set(gold_groups)
      pred_pairs = pair_set(pred_groups)
      inter = (gold_pairs & pred_pairs).size

      precision = pred_pairs.empty? ? 1.0 : inter.to_f / pred_pairs.size
      recall = gold_pairs.empty? ? 1.0 : inter.to_f / gold_pairs.size
      f1 = (precision + recall).zero? ? 0.0 : 2 * precision * recall / (precision + recall)
      { precision: round3(precision), recall: round3(recall), f1: round3(f1) }
    end

    def pair_set(groups)
      pairs = Set.new
      groups.each do |members|
        members.combination(2).each { |a, b| pairs << (a < b ? [a, b] : [b, a]) }
      end
      pairs
    end

    def unassigned_scores(pred_unassigned, gold_unassigned)
      inter = (pred_unassigned & gold_unassigned).size
      precision = pred_unassigned.empty? ? 1.0 : inter.to_f / pred_unassigned.size
      recall = gold_unassigned.empty? ? 1.0 : inter.to_f / gold_unassigned.size
      { precision: round3(precision), recall: round3(recall) }
    end

    # For V-measure, treat "should be unassigned" as a single recoverable class
    # and the model's leftover set as a single cluster.
    def class_map(gold_named, gold_unassigned, all)
      map = {}
      gold_named.each { |label, ids| ids.each { |i| map[i] = label } }
      all.each { |i| map[i] ||= UNASSIGNED }
      gold_unassigned.each { |i| map[i] = UNASSIGNED }
      map
    end

    def cluster_map(pred_groups, pred_unassigned, all)
      map = {}
      pred_groups.each_with_index { |ids, gi| ids.each { |i| map[i] = "c#{gi}" } }
      all.each { |i| map[i] ||= UNASSIGNED }
      pred_unassigned.each { |i| map[i] = UNASSIGNED }
      map
    end

    # Entropy-based homogeneity / completeness / V-measure (Rosenberg & Hirschberg).
    def v_measure(class_of, cluster_of)
      ids = class_of.keys
      n = ids.length.to_f
      return { homogeneity: 1.0, completeness: 1.0, v_measure: 1.0 } if n.zero?

      classes = ids.group_by { |i| class_of[i] }.transform_values(&:size)
      clusters = ids.group_by { |i| cluster_of[i] }.transform_values(&:size)
      joint = ids.group_by { |i| [class_of[i], cluster_of[i]] }.transform_values(&:size)

      h_c = entropy(classes.values, n)
      h_k = entropy(clusters.values, n)
      h_c_given_k = conditional_entropy(joint, clusters, n)
      h_k_given_c = conditional_entropy(joint.transform_keys { |(c, k)| [k, c] },
                                        classes, n)

      homogeneity = h_c.zero? ? 1.0 : 1.0 - (h_c_given_k / h_c)
      completeness = h_k.zero? ? 1.0 : 1.0 - (h_k_given_c / h_k)
      denom = homogeneity + completeness
      v = denom.zero? ? 0.0 : 2 * homogeneity * completeness / denom

      { homogeneity: round3(homogeneity), completeness: round3(completeness), v_measure: round3(v) }
    end

    def entropy(counts, n)
      counts.sum { |c| c.zero? ? 0.0 : -(c / n) * Math.log(c / n) }
    end

    # H(A|B) for joint keyed [a, b] given B counts.
    def conditional_entropy(joint, b_counts, n)
      joint.sum do |(_a, b), ab|
        next 0.0 if ab.zero?

        -(ab / n) * Math.log(ab.to_f / b_counts[b])
      end
    end

    def round3(x)
      (x.to_f * 1000).round / 1000.0
    end

    def round1(x)
      (x.to_f * 1000).round / 1000.0
    end
  end
end
