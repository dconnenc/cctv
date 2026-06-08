FactoryBot.define do
  factory :event do
    sequence(:title) { |n| "Comedy Show #{n}" }
    starts_at { 1.day.from_now }
    ends_at { 1.day.from_now + 2.hours }
    published { true }

    creator { association :user }
  end
end
