FactoryBot.define do
  factory :performer do
    user
    sequence(:name) { |n| "Performer #{n}" }
    bio { "A seasoned improviser." }
  end
end
