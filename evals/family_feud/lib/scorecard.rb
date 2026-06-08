# frozen_string_literal: true

module FamilyFeudEval
  # Aggregation + rendering for a run. Headline numbers macro-average over the
  # synthetic fixtures; anchors are summarized separately as a transfer check.
  module Scorecard
    # Numeric metrics averaged across runs / fixtures.
    METRIC_KEYS = %w[
      pairwise_f1 pairwise_precision pairwise_recall over_merge over_split
      homogeneity completeness v_measure unassigned_precision unassigned_recall
      bucket_count_delta
    ].freeze

    # The diagnostics shown in the per-dimension breakdown.
    DIMENSION_KEYS = %w[pairwise_f1 over_merge over_split unassigned_recall v_measure].freeze

    module_function

    # ---- per-fixture aggregation across the N runs ----

    def mean_metrics(metric_runs)
      return {} if metric_runs.empty?

      METRIC_KEYS.each_with_object({}) do |k, acc|
        vals = metric_runs.map { |r| r[k] }.compact
        acc[k] = mean(vals) unless vals.empty?
      end
    end

    def variance(metric_runs)
      return {} if metric_runs.length < 2

      %w[pairwise_f1 pairwise_precision pairwise_recall].each_with_object({}) do |k, acc|
        acc[k] = stdev(metric_runs.map { |r| r[k] }.compact)
      end
    end

    # ---- cross-fixture summary ----

    def summarize(fixtures)
      scored = fixtures.reject { |fx| fx["metrics"].nil? || fx["metrics"].empty? }
      means = METRIC_KEYS.each_with_object({}) do |k, acc|
        vals = scored.map { |fx| fx["metrics"][k] }.compact
        acc[k] = round3(mean(vals)) unless vals.empty?
      end

      {
        "fixture_count" => fixtures.length,
        "scored_count" => scored.length,
        "high_variance_count" => fixtures.count { |fx| fx["high_variance"] },
        "error_fixtures" => fixtures.count { |fx| (fx["errors"] || 0).positive? },
        "metrics" => means,
        "labels" => summarize_labels(fixtures),
        "judge" => summarize_judge(fixtures)
      }
    end

    def summarize_labels(fixtures)
      lc = fixtures.map { |fx| fx["labels"] }.compact
      {
        "generic_count" => lc.sum { |l| l["generic_count"] || 0 },
        "near_duplicate_count" => lc.sum { |l| l["near_duplicate_count"] || 0 },
        "too_long_count" => lc.sum { |l| l["too_long_count"] || 0 },
        "fixtures_with_generic" => lc.count { |l| (l["generic_count"] || 0).positive? }
      }
    end

    def summarize_judge(fixtures)
      judged = fixtures.map { |fx| fx["judge"] }.compact.reject { |j| j["error"] }
      return {} if judged.empty?

      Judge::DIMENSIONS.each_with_object("judged_count" => judged.length) do |d, acc|
        vals = judged.map { |j| j[d] }.compact
        acc[d] = round2(mean(vals)) unless vals.empty?
      end
    end

    def by_dimension(fixtures, all_tags)
      all_tags.sort.each_with_object({}) do |tag, acc|
        subset = fixtures.select { |fx| (fx["difficulty_tags"] || []).include?(tag) }
        next if subset.empty?

        scored = subset.reject { |fx| fx["metrics"].nil? || fx["metrics"].empty? }
        next if scored.empty?

        acc[tag] = DIMENSION_KEYS.each_with_object("count" => subset.length) do |k, h|
          vals = scored.map { |fx| fx["metrics"][k] }.compact
          h[k] = round3(mean(vals)) unless vals.empty?
        end
      end
    end

    def all_tags(fixtures)
      fixtures.flat_map { |fx| fx["difficulty_tags"] || [] }.uniq
    end

    def delta(curr, base)
      return {} unless base

      METRIC_KEYS.each_with_object({}) do |k, acc|
        next unless curr[k] && base[k]

        acc[k] = round3(curr[k] - base[k])
      end
    end

    # ---- rendering ----

    def render_console(variant_result, baseline_metrics: nil)
      agg = variant_result["aggregate"]
      m = agg["metrics"]
      lines = []
      lines << "═" * 72
      lines << "  VARIANT: #{variant_result['variant']}   (#{agg['scored_count']}/#{agg['fixture_count']} fixtures scored, #{variant_result['runs']} runs each)"
      lines << "═" * 72
      lines << "  HEADLINE (synthetic fixtures, macro-avg)"
      lines.concat(metric_lines(m, baseline_metrics))
      lines << ""
      lines << "  LABEL HEALTH   generic:#{agg['labels']['generic_count']}  near-dup:#{agg['labels']['near_duplicate_count']}  too-long:#{agg['labels']['too_long_count']}  (#{agg['labels']['fixtures_with_generic']} fixtures w/ generic name)"
      unless agg["judge"].empty?
        j = agg["judge"]
        lines << "  JUDGE (Pro)    specificity:#{j['specificity']}  ff_style:#{j['ff_style']}  name_accuracy:#{j['name_accuracy']}  board_resemblance:#{j['board_resemblance']}  (n=#{j['judged_count']})"
      end
      if agg["high_variance_count"].positive? || agg["error_fixtures"].positive?
        lines << "  FLAGS          high-variance:#{agg['high_variance_count']}  errored:#{agg['error_fixtures']}"
      end
      lines << ""
      lines << "  BY DIFFICULTY DIMENSION"
      variant_result["by_dimension"].each do |tag, d|
        lines << format("    %-12s f1:%.2f  over_merge:%.2f  over_split:%.2f  unassigned_recall:%.2f  (n=%d)",
                        tag, d["pairwise_f1"] || 0, d["over_merge"] || 0, d["over_split"] || 0, d["unassigned_recall"] || 0, d["count"])
      end
      if variant_result["anchor"] && !variant_result["anchor"]["metrics"].empty?
        am = variant_result["anchor"]["metrics"]
        lines << ""
        lines << format("  ANCHOR (real-style transfer check)  f1:%.2f  over_merge:%.2f  over_split:%.2f  unassigned_recall:%.2f  (n=%d)",
                        am["pairwise_f1"] || 0, am["over_merge"] || 0, am["over_split"] || 0, am["unassigned_recall"] || 0, variant_result["anchor"]["scored_count"])
      end
      lines << ""
      lines.concat(worst_fixtures(variant_result["fixtures"]))
      lines.join("\n")
    end

    def metric_lines(m, baseline)
      ordered = %w[pairwise_f1 over_merge over_split unassigned_recall unassigned_precision
                   homogeneity completeness v_measure bucket_count_delta]
      ordered.filter_map do |k|
        next unless m[k]

        d = baseline && baseline[k] ? format("  (Δ %+0.3f vs baseline)", m[k] - baseline[k]) : ""
        format("    %-22s %6.3f%s", k, m[k], d)
      end
    end

    def worst_fixtures(fixtures, limit: 5)
      ranked = fixtures.reject { |fx| fx["metrics"].nil? || fx["metrics"].empty? }
                       .sort_by { |fx| fx["metrics"]["pairwise_f1"] || 0 }
                       .first(limit)
      return [] if ranked.empty?

      out = ["  LOWEST-SCORING FIXTURES"]
      ranked.each do |fx|
        mx = fx["metrics"]
        out << format("    %-26s f1:%.2f merge:%.2f split:%.2f un_rec:%.2f  %s",
                      truncate(fx["id"], 26), mx["pairwise_f1"] || 0, mx["over_merge"] || 0,
                      mx["over_split"] || 0, mx["unassigned_recall"] || 0,
                      (fx["difficulty_tags"] || []).join(","))
      end
      out
    end

    # ---- numeric helpers ----

    def mean(vals)
      return 0.0 if vals.empty?

      vals.sum.to_f / vals.length
    end

    def stdev(vals)
      return 0.0 if vals.length < 2

      m = mean(vals)
      Math.sqrt(vals.sum { |v| (v - m)**2 } / vals.length).round(4)
    end

    def round3(x)
      (x.to_f * 1000).round / 1000.0
    end

    def round2(x)
      (x.to_f * 100).round / 100.0
    end

    def truncate(str, len)
      str.length > len ? "#{str[0, len - 1]}…" : str
    end
  end
end
