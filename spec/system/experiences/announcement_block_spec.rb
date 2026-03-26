require "rails_helper"

RSpec.describe "Announcement Block", type: :system do
  let(:admin) { create(:user, :admin) }

  it "shows participants interpolated values on their screens, and the correct management impersonation views" do
    sign_in(admin)
    create_experience_and_go_to_manage(
      name: "Test Experience", code: "test-exp"
    )

    queue_block(n: 1) do
      select "Announcement", from: "Kind"
      fill_in "Announcement Message", with: "Welcome {{ participant_name }} to the show!"
    end

    start_experience

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
    select_block(1, kind: "announcement")
    present_block

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
    select_block(1, kind: "announcement")

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

  describe "editing an announcement block" do
    before do
      sign_in(admin)
      create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

      queue_block(n: 1) do
        select "Announcement", from: "Kind"
        fill_in "Announcement Message", with: "Original message"
      end

      select_block(1, kind: "announcement")
    end

    context "when the block is hidden" do
      it "saves without a confirmation prompt" do
        click_button "Edit"
        expect(page).to have_text("Edit Block")

        fill_in "Announcement Message", with: "Updated message"
        click_button "Save"

        select_block(1, kind: "announcement")
        expect(page).to have_text("Updated message")
      end
    end

    context "when the block is open" do
      before do
        present_block
      end

      it "shows a warning and saves after confirmation" do
        click_button "Edit"
        expect(page).to have_text("Edit Block")

        fill_in "Announcement Message", with: "Updated message"
        click_button "Save"

        expect(page).to have_text("This block is currently active")
        click_button "Save Anyway"

        select_block(1, kind: "announcement")
        expect(page).to have_text("Updated message")
      end
    end
  end
end
