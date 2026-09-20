FactoryBot.define do
  factory :feedback do
    user

    feedback_type { Feedback::GENERAL }
    source { Feedback::MANUAL }
    description { "Something felt off during the second half." }
    context { { "route" => "/experiences/:code", "experience_code" => "abc" } }
    console_logs { [] }

    trait :bug do
      feedback_type { Feedback::BUG }
    end

    trait :error_report do
      source { Feedback::ERROR }
      feedback_type { Feedback::BUG }
      description { nil }
      error_fingerprint { "deadbeef" }
      context do
        {
          "error_message" => "Cannot read properties of undefined",
          "error_stack" => "Error: boom\n    at Poll (Poll.tsx:12:4)",
          "error_source" => "react_error_boundary"
        }
      end
    end

    trait :from_block do
      source { Feedback::BLOCK }
      feedback_type { Feedback::EXPERIENCE }
      experience
      experience_block
    end

    trait :synced do
      sync_status { :synced }
      linear_issue_id { "issue-#{SecureRandom.uuid}" }
      linear_issue_identifier { "CCT-1" }
      linear_issue_url { "https://linear.app/chicago-comedy-tv/issue/CCT-1" }
      linear_synced_at { Time.current }
    end
  end
end
