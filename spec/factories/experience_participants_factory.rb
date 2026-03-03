FactoryBot.define do
  factory :experience_participant do
    user
    experience

    status { ExperienceParticipant.statuses[:registered] }

    role { ExperienceParticipant.roles[:audience] }

    name { user&.name || "Test Participant" }

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

