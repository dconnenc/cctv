FactoryBot.define do
  factory :user do
    name { 'name' }
    email { "#{SecureRandom.alphanumeric(8)}@gmail.com" }
    role { User.roles[:user] }

    trait :user do
      role { User.roles[:user] }
    end

    trait :admin do
      role { User.roles[:admin] }
    end
  end
end
