FactoryBot.define do
  factory :experience_block do
    experience

    kind { "poll" }
    status { ExperienceBlock.statuses[:open] }

    sequence(:position) { |n| n }

    transient do
      visible_to_segment_names { [] }
    end

    after(:create) do |block, evaluator|
      if evaluator.visible_to_segment_names.any?
        evaluator.visible_to_segment_names.each do |name|
          segment = block.experience.experience_segments.find_or_create_by!(name: name) do |s|
            s.color = '#6B7280'
            s.position = block.experience.experience_segments.count
          end
          ExperienceBlockSegment.create!(experience_block: block, experience_segment: segment)
        end
      end
    end

    trait :announcement do
      kind { ExperienceBlock::ANNOUNCEMENT }
      payload { { "message" => "Hello", "show_on_monitor" => false } }
    end

    trait :family_feud do
      kind { ExperienceBlock::FAMILY_FEUD }
      
      transient do
        question_count { 2 }
        questions { nil }
      end

      after(:create) do |block, evaluator|
        questions_to_create = evaluator.questions || 
          evaluator.question_count.times.map { |i| { question: "Question #{i + 1}" } }

        questions_to_create.each_with_index do |question_spec, index|
          child_block = create(
            :experience_block,
            experience: block.experience,
            kind: ExperienceBlock::QUESTION,
            status: block.status,
            payload: { 
              question: question_spec[:question] || question_spec["question"],
              formKey: "answer_#{index}",
              inputType: "text"
            },
            visible_to_roles: block.visible_to_roles,
            target_user_ids: [],
            parent_block_id: block.id,
            position: index,
            show_in_lobby: true
          )

          ExperienceBlockLink.create!(
            parent_block: block,
            child_block: child_block,
            relationship: :depends_on
          )
        end
      end
    end

  end
end
