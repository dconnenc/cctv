FactoryBot.define do
  factory :experience_block do
    experience

    kind { "poll" }
    status { ExperienceBlock.statuses[:open] }
  end
end
