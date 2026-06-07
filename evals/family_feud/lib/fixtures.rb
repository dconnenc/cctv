# frozen_string_literal: true

require "json"

module FamilyFeudEval
  module Fixtures
    ROOT = File.expand_path("..", __dir__)
    FIXTURES_DIR = File.join(ROOT, "fixtures")
    ANCHOR_DIR = File.join(ROOT, "anchor")
    SOURCES_DIR = File.join(ROOT, "fixtures_src")

    module_function

    # Frozen synthetic fixtures + hand-authored real-style anchors. Anchors are
    # tagged so the scorecard can report them separately as a transfer check.
    def load_all
      synthetic = glob(FIXTURES_DIR)
      anchors = glob(ANCHOR_DIR).each { |fx| fx["anchor"] = true }
      (synthetic + anchors).sort_by { |fx| fx["id"] }
    end

    def load_sources
      glob(SOURCES_DIR)
    end

    def glob(dir)
      Dir.glob(File.join(dir, "*.json")).sort.map { |p| JSON.parse(File.read(p)) }
    end
  end
end
