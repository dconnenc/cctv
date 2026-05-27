FactoryBot.define do
  factory :experience_buzzer_submission do
    association :experience_block
    association :experience_participant
    answer { { "buzzed_at" => Time.current.iso8601 } }
  end
end
