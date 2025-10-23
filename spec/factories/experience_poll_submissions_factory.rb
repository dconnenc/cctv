FactoryBot.define do
  factory :experience_poll_submission do
    association :experience_block
    association :user
    answer { { "selectedOptions" => ["option_a"] } }
  end
end