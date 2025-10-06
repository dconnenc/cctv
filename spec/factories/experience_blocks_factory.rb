FactoryBot.define do
  factory :experience_block do
    experience

    kind { "poll" }
    status { ExperienceBlock.statuses[:open] }

    trait :mad_lib_sourced do
      kind { ExperienceBlock::MAD_LIB }
      payload do
        {
          "segments" => [
            { "id" => "1", "type" => "text", "content" => "I love " },
            {
              "id" => "2",
              "type" => "variable",
              "content" => "thing"
            },
            { "id" => "3", "type" => "text", "content" => " and " },
            {
              "id" => "4",
              "type" => "variable",
              "content" => "activity"
            },
          ]
        }
      end

      transient do
        participant_for_question { nil }
        poll_payload do
          {
            "question" => "What is your favorite activity?",
            "options" => ["coding", "reading", "gaming"],
            "pollType" => "single"
          }
        end
        question_source_block { nil }
        poll_source_block { nil }
      end

      after(:create) do |block, evaluator|
        question_block = evaluator.question_source_block ||
          create(
            :experience_block,
            experience: block.experience,
            kind: ExperienceBlock::QUESTION,
            status: block.status,
            payload: {
              "question" => "Favorite thing",
              "formKey" => "thing",
              "inputType" => "text"
            },
            target_user_ids: evaluator.participant_for_question ?
              [evaluator.participant_for_question.user_id] : []
          )

        poll_block = evaluator.poll_source_block ||
          create(
            :experience_block,
            experience: block.experience,
            kind: ExperienceBlock::POLL,
            status: block.status,
            payload: evaluator.poll_payload
          )

        thing_variable = block.variables.create!(
          key: "thing",
          label: "Favorite thing",
          datatype: "string",
          required: true
        )

        activity_variable = block.variables.create!(
          key: "activity",
          label: "Favorite activity",
          datatype: "string",
          required: true
        )

        ExperienceBlockVariableBinding.create!(
          variable: thing_variable,
          source_block: question_block
        )

        ExperienceBlockVariableBinding.create!(
          variable: activity_variable,
          source_block: poll_block
        )

        ExperienceBlockLink.create!(
          parent_block: block,
          child_block: question_block,
          relationship: :depends_on,
          position: 0
        )

        ExperienceBlockLink.create!(
          parent_block: block,
          child_block: poll_block,
          relationship: :depends_on,
          position: 1
        )
      end
    end
  end
end
