# frozen_string_literal: true

module FamilyFeudEval
  # A prompt variant turns (question, answers) into the (prompt_string, schema)
  # pair the eval feeds to Gemini. "production" reuses the real shipping builder
  # verbatim so the default run scores exactly what players get. Named variants
  # are {{question}}/{{answers}} templates in prompts/<name>.txt for A/B testing.
  module PromptVariant
    PROMPTS_DIR = File.expand_path("../prompts", __dir__)

    module_function

    def build(name)
      return Production.new if name == "production"

      path = File.join(PROMPTS_DIR, "#{name}.txt")
      raise ArgumentError, "Unknown prompt variant '#{name}' (expected #{path})" unless File.exist?(path)

      Template.new(name, File.read(path))
    end

    class Production
      def name
        "production"
      end

      def build(question:, answers:)
        builder = ::AI::Prompts::FamilyFeudBucketing.new(question_text: question, answers: answers)
        [builder.prompt, builder.response_schema]
      end
    end

    class Template
      attr_reader :name

      def initialize(name, template)
        @name = name
        @template = template
      end

      def build(question:, answers:)
        answer_list = answers.map { |a| "- #{a[:text]} (id: #{a[:id]})" }.join("\n")
        prompt = @template.gsub("{{question}}", question.to_s).gsub("{{answers}}", answer_list)
        schema = ::AI::Prompts::FamilyFeudBucketing.new(question_text: question, answers: answers).response_schema
        [prompt, schema]
      end
    end
  end
end
