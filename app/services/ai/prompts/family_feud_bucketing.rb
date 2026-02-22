module AI
  module Prompts
    class FamilyFeudBucketing
      def initialize(question_text:, answers:)
        @question_text = question_text
        @answers = answers
      end

      def prompt
        answer_list = @answers.map { |a| "- #{a[:text]} (id: #{a[:id]})" }.join("\n")

        <<~PROMPT
          You are categorizing audience survey responses for a Family Feud-style game.

          Question: "#{@question_text}"

          Answers to categorize:
          #{answer_list}

          Group these answers into buckets of semantically similar responses, like the answer board on Family Feud.

          Rules:
          - Every answer must be assigned to exactly one bucket
          - Every bucket must contain at least one answer — do NOT create empty buckets
          - Never create more buckets than there are answers
          - Bucket names should be concise (1-4 words), natural, and Family Feud style (e.g. "The Commute", "Sleeping In", "Mom's Cooking")
          - Similar answers belong in the same bucket
          - Return valid JSON matching the schema
        PROMPT
      end

      def response_schema
        {
          type: "OBJECT",
          properties: {
            buckets: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  answer_ids: {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  }
                },
                required: ["name", "answer_ids"]
              }
            }
          },
          required: ["buckets"]
        }
      end
    end
  end
end
