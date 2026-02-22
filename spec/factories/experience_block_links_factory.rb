FactoryBot.define do
  factory :experience_block_link do
    parent_block { association :experience_block }
    child_block { association :experience_block }
    relationship { :depends_on }
  end
end
