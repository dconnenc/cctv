FactoryBot.define do
  factory :experience do
    name { "Experience" }
    status { Experience.statuses[:draft] }
    code { SecureRandom.alphanumeric(8) }

    creator { association :user }

    trait :draft do
      status { Experience.statuses[:draft] }
    end
  end
end
