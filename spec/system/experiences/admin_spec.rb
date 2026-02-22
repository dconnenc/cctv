require "rails_helper"

RSpec.describe "Creating a new experience", type: :system do
  let(:admin) { create(:user, :admin) }

  def sign_in(user)
    visit "/"
    expect(page).to have_text("CCTV")

    click_button "Menu"
    click_link "Sign in"

    fill_in "email", with: user.email
    click_button "Sign in"

    expect(page).to have_button("Menu")
  end

  def create_experience(name:, code:)
    click_button "Menu"
    click_link "Create"

    expect(page).to have_text("Create Experience")
    fill_in "Name", with: name
    fill_in "Code", with: code
    click_button "Create"

    expect(page).to have_css("img[alt='QR code for joining an experience']")
  end

  it "creates an experience and navigates to the manage page" do
    sign_in(admin)
    create_experience(name: "Test Experience", code: "test-exp")

    click_link "Go to lobby"

    expect(page).to have_text(
      "You're viewing this experience as an admin but aren't registered as a participant."
    )
    expect(page).to have_no_css(".app--booting")

    click_link "Manage Experience"

    expect(page).to have_text("No blocks yet")
  end

  it "creates an announcement block with interpolation and starts the experience" do
    sign_in(admin)
    create_experience(name: "Test Experience", code: "test-exp")

    click_link "Go to lobby"

    expect(page).to have_text(
      "You're viewing this experience as an admin but aren't registered as a participant."
    )
    expect(page).to have_no_css(".app--booting")

    click_link "Manage Experience"
    expect(page).to have_text("No blocks yet")

    click_button "Block"

    expect(page).to have_text("Create Block")
    select "Announcement", from: "Kind"
    fill_in "Announcement Message", with: "Welcome {{ participant_name }} to the show!"
    click_button "Queue block"

    expect(page).to have_text("announcement")
    expect(page).to have_no_text("No blocks yet")

    click_button "Start"

    expect(page).to have_button("Pause")
  end
end
