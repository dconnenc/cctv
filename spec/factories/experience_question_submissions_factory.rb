FactoryBot.define do
  factory :experience_question_submission do
    association :experience_block
    association :experience_participant
    answer { { "value" => "Sample answer" } }
  end
end
