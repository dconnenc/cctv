FactoryBot.define do
  factory :experience_participant do
    user
    experience

    status { ExperienceParticipant.statuses[:registered] }

    role { ExperienceParticipant.roles[:audience] }

    name { user&.name || "Test Participant" }

    transient do
      segments { [] }
    end

    after(:create) do |participant, evaluator|
      if evaluator.segments.any?
        evaluator.segments.each do |name|
          segment = participant.experience.experience_segments.find_or_create_by!(name: name) do |s|
            s.color = '#6B7280'
            s.position = participant.experience.experience_segments.count
          end
          ExperienceParticipantSegment.create!(experience_participant: participant, experience_segment: segment)
        end
      end
    end

    trait :with_avatar do
      avatar do
        {
          'strokes' => [
            {
              'points' => [1, 2, 3, 4],
              'color' => '#ff0000',
              'width' => 4
            }
          ]
        }
      end
    end

    trait :audience do
      role { ExperienceParticipant.roles[:audience] }
    end

    trait :player do
      role { ExperienceParticipant.roles[:player] }
    end

    trait :moderator do
      role { ExperienceParticipant.roles[:moderator] }
    end

    trait :host do
      role { ExperienceParticipant.roles[:host] }
    end
  end
end

