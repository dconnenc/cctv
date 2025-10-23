FactoryBot.define do
  factory :experience_question_submission do
    association :experience_block
    association :user
    answer { { "value" => "Sample answer" } }
  end
end
