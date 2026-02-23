require "rails_helper"

RSpec.describe "Creating a new experience", type: :system do
  let(:admin) { create(:user, :admin) }

  it "creates an announcement block starts the experience" do
    sign_in(admin)
    create_experience(name: "Test Experience", code: "test-exp")

    click_link "Go to lobby"

    expect(page).to have_text(
      "You're viewing this experience as an admin but aren't registered as a " \
        "participant."
    )

    click_link "Manage Experience"
    expect(page).to have_text("No blocks yet")

    click_button "Block"

    expect(page).to have_text("Create Block")
    select "Announcement", from: "Kind"
    fill_in "Announcement Message", with: "Welcome to the show!"
    click_button "Queue block"

    expect(page).to have_text("announcement")
    expect(page).to have_no_text("No blocks yet")

    click_button "Start"

    expect(page).to have_button("Pause")
  end
end
