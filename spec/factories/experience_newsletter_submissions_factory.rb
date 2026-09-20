FactoryBot.define do
  factory :experience_newsletter_submission do
    association :experience_block
    association :experience_participant
    answer { { "subscribed" => true, "submittedAt" => Time.current.iso8601 } }
  end
end
