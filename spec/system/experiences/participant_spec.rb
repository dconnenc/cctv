require "rails_helper"

RSpec.describe "Participant experience", type: :system do
  let(:admin) { create(:user, :admin) }

  it "participant sees an announcement block after admin presents it" do
    sign_in(admin)
    create_experience(name: "Test Experience", code: "test-exp")

    click_button "Block"

    expect(page).to have_text("Create Block")
    select "Announcement", from: "Kind"
    fill_in "Announcement Message", with: "Welcome {{ participant_name }} to the show!"
    click_button "Queue block"

    expect(page).to have_text("announcement")
    expect(page).to have_no_text("No blocks yet")

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
    wait_for_boot
    expect(page).to have_text("announcement")
    find("button", text: /announcement/).click
    click_button "Present"

    using_session(:participant) do
      expect(page).to have_text("Welcome Alice to the show!")
    end
  end
end
