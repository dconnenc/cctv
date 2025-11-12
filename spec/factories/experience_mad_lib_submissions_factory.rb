FactoryBot.define do
  factory :experience_mad_lib_submission do
    association :experience_block
    association :user
    answer { { "name" => "John", "place" => "Park" } }
  end
end
