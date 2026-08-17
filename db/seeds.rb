# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end
superadmins = [
  ["jared.shay@gmail.com", "Jared"],
  ["dconnenc@gmail.com", "Dillon"],
  ["cam9548@gmail.com", "Cam"]
].map do |email, name|
  User.find_or_create_by!(name: name, email: email, role: "superadmin")
end

Cosmetic.find_or_create_by!(slug: "top-hat") do |cosmetic|
  cosmetic.name             = "Top Hat"
  cosmetic.kind             = "hat"
  cosmetic.category         = "clothing"
  cosmetic.asset_key        = "hat"
  cosmetic.default_placement = { "x" => 100, "y" => 24, "width" => 120, "height" => 96, "rotation" => 0 }
  cosmetic.price_cents      = 0
  cosmetic.default_grant    = true
  cosmetic.active           = true
end

Cosmetic.find_or_create_by!(slug: "sunglasses") do |cosmetic|
  cosmetic.name             = "Sunglasses"
  cosmetic.kind             = "sunglasses"
  cosmetic.category         = "clothing"
  cosmetic.asset_key        = "sunglasses"
  cosmetic.default_placement = { "x" => 100, "y" => 120, "width" => 120, "height" => 52, "rotation" => 0 }
  cosmetic.price_cents      = 0
  cosmetic.default_grant    = true
  cosmetic.active           = true
end

User.find_each do |user|
  Cosmetic.active.default_grant.find_each do |cosmetic|
    user.user_cosmetics.find_or_create_by!(cosmetic: cosmetic) { |uc| uc.source = "grant" }
  end
end

# A frame wraps the whole avatar and is gated to beta testers (users created
# before User::BETA_TESTER_CUTOFF).
Cosmetic.find_or_create_by!(slug: "beta-tester-frame") do |cosmetic|
  cosmetic.name             = "Beta Tester"
  cosmetic.kind             = "frame"
  cosmetic.category         = "frame"
  cosmetic.asset_key        = "beta_tester_frame"
  cosmetic.default_placement = { "x" => 0, "y" => 0, "width" => 320, "height" => 320, "rotation" => 0 }
  cosmetic.price_cents      = 0
  cosmetic.default_grant    = false
  cosmetic.beta_only        = true
  cosmetic.active           = true
end

User.beta_testers.find_each do |user|
  Cosmetic.active.beta_only.find_each do |cosmetic|
    user.user_cosmetics.find_or_create_by!(cosmetic: cosmetic) { |uc| uc.source = "grant" }
  end
end

# Non-admin account for exercising the cosmetics/avatar flow. Admin and superadmin
# accounts bypass the avatar drawing screen, so use this user to reach it. Owns
# every active cosmetic.
cosmetics_tester = User.find_or_create_by!(email: "cosmetics_test_user@gmail.com") do |user|
  user.name = "Cosmetics Test User"
  user.role = "user"
end

Cosmetic.active.find_each do |cosmetic|
  cosmetics_tester.user_cosmetics.find_or_create_by!(cosmetic: cosmetic) { |uc| uc.source = "grant" }
end

Event.find_or_create_by!(slug: "chicago-comedy-social-technical-expo-2026") do |event|
  event.title         = "Chicago Comedy Social & Technical Expo"
  event.description   = "A celebration of Chicago's comedy community at The Den Theatre."
  event.starts_at     = Time.zone.local(2026, 6, 11, 19, 0)
  event.ends_at       = Time.zone.local(2026, 6, 11, 23, 0)
  event.venue_name    = "The Den Theatre"
  event.venue_address = "1331 N Milwaukee Ave, Chicago, IL 60622"
  event.ticket_url    = "https://thedentheatre.com/performances/2026/6/11/chicago-comedy-social-technical-expo-the-den-theatre-comedy-club-chicago"
  event.published     = true
  event.creator       = superadmins.first
end
