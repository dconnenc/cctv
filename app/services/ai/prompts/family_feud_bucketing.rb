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

          Group these answers into 3-8 buckets of semantically similar responses. Each bucket should have a short, generalized label (Family Feud style - e.g., "Going to work", "Eating breakfast", "Checking phone").

          Rules:
          - Every answer must be assigned to exactly one bucket
          - Bucket names should be concise (1-4 words)
          - Similar answers belong in the same bucket
          - Use natural, conversational bucket names
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
