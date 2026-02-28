require "rails_helper"

RSpec.describe "Announcement Block", type: :system do
  let(:admin) { create(:user, :admin) }

  it "shows participants interpolated values on their screens, and the correct management impersonation views" do
    sign_in(admin)
    create_experience_and_go_to_manage(
      name: "Test Experience", code: "test-exp"
    )

    click_button "Block"

    expect(page).to have_text("Create Block")
    select "Announcement", from: "Kind"
    fill_in(
      "Announcement Message",
      with: "Welcome {{ participant_name }} to the show!"
    )
    click_button "Queue block"

    expect(page).to have_css("li[aria-label='block 1']")

    click_button "Start"
    expect(page).to have_button("Pause")

    using_session(:participant) do
      register_participant(
        code: "test-exp",
        name: "Alice",
        email: "alice@example.com",
        experience_name: "Test Experience"
      )

      expect(page).to have_text("Waiting for the next activity...")
    end

    visit current_path
    expect(page).to have_css("li[aria-label='block 1']")
    within("li[aria-label='block 1']") { find("button", text: /announcement/).click }
    click_button "Present"

    using_session(:participant) do
      expect(page).to have_text("Welcome Alice to the show!")
    end

    using_session(:participant_two) do
      register_participant(
        code: "test-exp",
        name: "Bob",
        email: "bob@example.com",
        experience_name: "Test Experience"
      )

      expect(page).to have_text("Welcome Bob to the show!")
    end

    visit current_path
    within("li[aria-label='block 1']") { find("button", text: /announcement/).click }

    within("[aria-label='Preview mode']") { click_button "Participant" }
    expect(page).to have_select("View as participant")
    select "Alice (audience)", from: "View as participant"
    expect(page).to have_text("Welcome Alice to the show!")

    select "Bob (audience)", from: "View as participant"
    expect(page).to have_text("Welcome Bob to the show!")

    within("[aria-label='Preview mode']") { click_button "Monitor" }
    expect(page).to have_text("Welcome {{ participant_name }} to the show!")

    using_session(:monitor) do
      visit "/experiences/test-exp/monitor"
      expect(page).to have_text("Welcome {{ participant_name }} to the show!")
    end
  end
end
