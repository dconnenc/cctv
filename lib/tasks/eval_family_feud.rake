# frozen_string_literal: true

# Family Feud bucketing eval harness. On-demand prompt-iteration scorecard — NOT
# a CI gate. Hits the real Gemini API, so it is excluded from the test suite.
#
#   rake eval:family_feud                     # score the production prompt, show Δ vs baseline
#   VARIANTS=production,candidate rake eval:family_feud   # A/B prompt variants
#   RUNS=3 JUDGE=false rake eval:family_feud  # tune cost
#   rake eval:family_feud:baseline            # refresh the checked-in baseline.json
#   rake eval:family_feud:generate            # rebuild frozen fixtures from fixtures_src/

namespace :eval do
  namespace :family_feud do
    eval_root = File.expand_path("../../evals/family_feud", __dir__)

    desc "Run the Family Feud bucketing eval scorecard (VARIANTS, RUNS, JUDGE env vars)"
    task run: :environment do
      require File.join(eval_root, "lib/eval")

      variants = (ENV["VARIANTS"] || "production").split(",").map(&:strip).reject(&:empty?)
      runs = (ENV["RUNS"] || FamilyFeudEval::Runner::N_RUNS).to_i
      judge = ENV["JUDGE"] != "false"

      result = FamilyFeudEval::Runner.new(variant_names: variants, runs: runs, judge: judge).run
      baseline = load_baseline(eval_root)

      rendered = result["variants"].map do |vr|
        base = (vr["variant"] == (baseline && baseline["variant"])) ? baseline["metrics"] : nil
        FamilyFeudEval::Scorecard.render_console(vr, baseline_metrics: base)
      end.join("\n\n")

      puts "\n#{rendered}\n"
      write_results(eval_root, result, rendered)
    end

    desc "Refresh the checked-in baseline.json from the production prompt"
    task baseline: :environment do
      require File.join(eval_root, "lib/eval")

      runs = (ENV["RUNS"] || FamilyFeudEval::Runner::N_RUNS).to_i
      result = FamilyFeudEval::Runner.new(variant_names: ["production"], runs: runs, judge: false).run
      agg = result["variants"].first["aggregate"]

      payload = {
        "variant" => "production",
        "model" => result["model"],
        "runs" => runs,
        "generated_at" => Time.now.utc.iso8601,
        "metrics" => agg["metrics"]
      }
      path = File.join(eval_root, "baseline.json")
      File.write(path, JSON.pretty_generate(payload) + "\n")
      puts "Wrote baseline → #{path}"
      puts JSON.pretty_generate(agg["metrics"])
    end

    desc "Rebuild frozen fixtures/*.json from hand-authored fixtures_src/*.json"
    task :generate do
      require File.join(eval_root, "lib/expand")
      require File.join(eval_root, "lib/fixtures")

      out_dir = File.join(eval_root, "fixtures")
      FileUtils.mkdir_p(out_dir)
      sources = FamilyFeudEval::Fixtures.load_sources
      sources.each do |src|
        fixture = FamilyFeudEval::Expand.fixture_from_source(src)
        path = File.join(out_dir, "#{fixture['id']}.json")
        File.write(path, JSON.pretty_generate(fixture) + "\n")
      end
      puts "Generated #{sources.length} fixtures → #{out_dir}"
    end
  end

  task family_feud: "eval:family_feud:run"
end

def load_baseline(eval_root)
  path = File.join(eval_root, "baseline.json")
  return nil unless File.exist?(path)

  JSON.parse(File.read(path))
end

def write_results(eval_root, result, rendered)
  dir = File.join(eval_root, "results")
  FileUtils.mkdir_p(dir)
  stamp = Time.now.utc.strftime("%Y%m%dT%H%M%SZ")
  File.write(File.join(dir, "result-#{stamp}.json"), JSON.pretty_generate(result) + "\n")
  File.write(File.join(dir, "result-#{stamp}.md"), "```\n#{rendered}\n```\n")
  puts "Results written → #{File.join(dir, "result-#{stamp}.{json,md}")}"
end
