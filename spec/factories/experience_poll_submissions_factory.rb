FactoryBot.define do
  factory :experience_poll_submission do
    association :experience_block
    association :experience_participant
    answer { { "selectedOptions" => ["option_a"] } }
  end
end