FactoryBot.define do
  factory :experience_poll_submission do
    association :experience_block
    association :user
    answer { "option_a" }

    trait :with_different_answer do
      answer { "option_b" }
    end

    trait :with_custom_answer do
      answer { "custom_answer" }
    end
  end
end