require "rails_helper"

RSpec.describe "Creating a new experience", type: :system do
  let(:admin) { create(:user, :admin) }

  it "creates an experience and navigates to the manage page" do
    # TODO: Properly go through the auth flow instead of auto-login.
    # The refresh is needed because the SPA doesn't pick up the session cookie
    # set by the auto-login redirect.
    visit "/users/sign_in"
    fill_in "email", with: admin.email
    click_button "Sign in"
    visit current_path

    click_button "Menu"
    click_link "Create"

    fill_in "Name", with: "Test Experience"
    fill_in "Code", with: "test-exp"
    click_button "Create"

    expect(page).to have_css("img[alt='QR code for joining an experience']")

    click_link "Go to lobby"

    expect(page).to have_text(
      "You're viewing this experience as an admin but aren't registered as a participant."
    )

    expect(page).to have_no_css(".app--booting")

    click_link "Manage Experience"

    expect(page).to have_text("No blocks yet")
  end
end
