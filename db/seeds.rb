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
