FactoryBot.define do
  factory :cosmetic do
    sequence(:name) { |n| "Cosmetic #{n}" }
    sequence(:slug) { |n| "cosmetic-#{n}" }
    kind { "hat" }
    category { "clothing" }
    asset_key { "hat" }
    default_placement { { "x" => 100, "y" => 24, "width" => 120, "height" => 96, "rotation" => 0 } }
    price_cents { 0 }
    default_grant { false }
    beta_only { false }
    active { true }

    trait :frame do
      kind { "frame" }
      category { "frame" }
      asset_key { "beta_tester_frame" }
      beta_only { true }
      default_placement { { "x" => 0, "y" => 0, "width" => 320, "height" => 320, "rotation" => 0 } }
    end
  end

  factory :user_cosmetic do
    association :user
    association :cosmetic
    source { "grant" }
  end
end
