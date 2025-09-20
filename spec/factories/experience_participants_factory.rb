FactoryBot.define do
  factory :experience_participant do
    user
    experience

    status { ExperienceParticipant.statuses[:registered] }

    role { ExperienceParticipant.roles[:audience] }

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

