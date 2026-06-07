# frozen_string_literal: true

require "set"

module FamilyFeudEval
  # Orchestrates a run: for each variant, score every fixture N times against the
  # frozen gold partition, aggregate, and (optionally) judge. Hits the real
  # AI::Client/Gemini path so it measures exactly what production ships. No hard
  # pass/fail — it returns a structured scorecard.
  class Runner
    N_RUNS = 3
    FLASH = "gemini-2.5-flash"
    HIGH_VARIANCE = 0.1 # stdev of pairwise_f1 across runs
    MAX_RETRIES = 4
    # Transient Gemini conditions worth retrying with backoff (demand spikes,
    # rate limits, transient network blips) rather than recording as a failure.
    TRANSIENT = /\b(503|429|500|UNAVAILABLE|RESOURCE_EXHAUSTED|overload|high demand|timeout|deadline|connection)\b/i

    def initialize(variant_names:, runs: N_RUNS, judge: true)
      @variants = variant_names.map { |n| PromptVariant.build(n) }
      @runs = runs
      @judge = judge
      @fixtures = Fixtures.load_all
    end

    def run
      {
        "runs" => @runs,
        "model" => FLASH,
        "judge_model" => (@judge ? Judge::MODEL : nil),
        "variants" => @variants.map { |v| run_variant(v) }
      }
    end

    def run_variant(variant)
      records = @fixtures.map { |fx| run_fixture(variant, fx) }
      synthetic = records.reject { |r| r["anchor"] }
      anchors = records.select { |r| r["anchor"] }

      {
        "variant" => variant.name,
        "runs" => @runs,
        "fixtures" => records,
        "aggregate" => Scorecard.summarize(synthetic),
        "anchor" => Scorecard.summarize(anchors),
        "by_dimension" => Scorecard.by_dimension(synthetic, Scorecard.all_tags(synthetic))
      }
    end

    def run_fixture(variant, fixture)
      all_ids = fixture["raw_responses"].map { |r| r["id"] }
      answers = fixture["raw_responses"].map { |r| { id: r["id"], text: r["text"] } }
      prompt, schema = variant.build(question: fixture["question"], answers: answers)

      runs = []
      last_buckets = []
      @runs.times do
        buckets = call_model(prompt, schema, all_ids)
        last_buckets = buckets
        runs << Metrics.score(gold: fixture["gold"], pred: buckets, all_ids: all_ids)
      rescue StandardError => e
        runs << { "error" => "#{e.class}: #{e.message.to_s[0, 200]}" }
      end

      scored = runs.reject { |r| r["error"] }
      variance = Scorecard.variance(scored)

      record = {
        "id" => fixture["id"],
        "season" => fixture["season"],
        "question" => fixture["question"],
        "difficulty_tags" => fixture["difficulty_tags"],
        "anchor" => fixture["anchor"] == true,
        "errors" => runs.count { |r| r["error"] },
        "metrics" => Scorecard.mean_metrics(scored),
        "variance" => variance,
        "high_variance" => (variance["pairwise_f1"] || 0) > HIGH_VARIANCE,
        "labels" => LabelChecks.check(last_buckets),
        "buckets" => render_buckets(last_buckets, fixture)
      }

      if @judge && !last_buckets.empty?
        record["judge"] = Judge.evaluate(
          question: fixture["question"],
          board_labels: fixture["board"].map { |b| b["label"] },
          buckets: last_buckets,
          id_to_text: id_to_text(fixture)
        )
      end

      record
    end

    private

    # Mirror production: drop unknown ids and empty buckets.
    def call_model(prompt, schema, all_ids)
      result = with_retry do
        ::AI::Client.call(prompt: prompt, response_schema: schema, model: FLASH, temperature: 0)
      end
      id_set = all_ids.to_set
      (result["buckets"] || []).filter_map do |b|
        ids = (b["answer_ids"] || []).select { |i| id_set.include?(i) }
        next if ids.empty?

        { "name" => b["name"].to_s, "answer_ids" => ids }
      end
    end

    # Retry transient Gemini failures with capped exponential backoff. Any other
    # error (or exhausted retries) propagates to the per-run rescue, which records
    # it without killing the whole run.
    def with_retry
      attempts = 0
      begin
        yield
      rescue StandardError => e
        attempts += 1
        raise if attempts > MAX_RETRIES || !(e.message.to_s =~ TRANSIENT)

        sleep([2**attempts, 8].min)
        retry
      end
    end

    def render_buckets(buckets, fixture)
      texts = id_to_text(fixture)
      buckets.map { |b| { "name" => b["name"], "members" => b["answer_ids"].map { |i| texts[i] } } }
    end

    def id_to_text(fixture)
      fixture["raw_responses"].to_h { |r| [r["id"], r["text"]] }
    end
  end
end
