FactoryBot.define do
  factory :experience_multistep_form_submission do
    association :experience_block
    association :user
    answer { { "step1" => "data", "step2" => "more data" } }
  end
end
