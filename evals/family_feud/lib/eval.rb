# frozen_string_literal: true

# Entry point for the Family Feud bucketing eval harness. Required by the rake
# tasks under a loaded Rails environment (the runner/judge call AI::Client).
# Lives outside app/ and lib/ so Zeitwerk never autoloads it into production.

require_relative "expand"
require_relative "metrics"
require_relative "label_checks"
require_relative "fixtures"
require_relative "prompt_variant"
require_relative "judge"
require_relative "scorecard"
require_relative "runner"
