FactoryBot.define do
  factory :tenant do
    sequence(:key) { |n| "tenant-#{n}" }
    name { key.titleize }
  end
end
