module Minigames
  class ArithmeticProgress
    def self.for_participant(block:, user:)
      return { "current_question" => nil, "score" => { "correct" => 0, "completed" => 0 } } unless user

      payload   = block.payload || {}
      started   = payload["started_at"].present?
      ended     = payload["ended_at"].present?
      questions = Array(payload["questions"])

      submissions = ExperienceMinigameSubmission
        .where(experience_block_id: block.id, user_id: user.id)
        .order(question_index: :asc)
        .to_a

      answered = submissions.map(&:question_index).to_set

      next_question = nil
      if started && !ended
        q = questions.find { |q| !answered.include?(q["index"]) }
        next_question = { "index" => q["index"], "prompt" => q["prompt"] } if q
      end

      {
        "current_question" => next_question,
        "score"            => { "correct" => submissions.count(&:correct), "completed" => submissions.size }
      }
    end
  end
end
