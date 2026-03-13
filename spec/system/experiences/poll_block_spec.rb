require "rails_helper"

RSpec.describe "Poll Block", type: :system do
  let(:admin) { create(:user, :admin) }

  it "assigns participants to segments based on poll responses and shows segment-scoped announcements" do
    sign_in(admin)
    create_experience_and_go_to_manage(
      name: "Test Experience", code: "test-exp"
    )

    within_participants_panel do
      click_button "+ Add"
      fill_in placeholder: "Segment name", with: "Team A"
      click_button "Add"
      expect(page).to have_text("Team A")

      click_button "+ Add"
      fill_in placeholder: "Segment name", with: "Team B"
      click_button "Add"
      expect(page).to have_text("Team B")
    end

    # Create a poll block with each option assigned to a segment
    click_button "Block"
    expect(page).to have_text("Create Block")
    select "Poll", from: "Kind"
    fill_in "Poll Question", with: "Pick your team"
    fill_in "Option 1", with: "Team A"
    fill_in "Option 2", with: "Team B"

    expect(page).to have_selector("label", text: /Assign segment/, count: 2)
    all("label", text: /Assign segment/)[0].find("select").select("Team A")
    all("label", text: /Assign segment/)[1].find("select").select("Team B")

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

    using_session(:participant_two) do
      register_participant(
        code: "test-exp",
        name: "Bob",
        email: "bob@example.com",
        experience_name: "Test Experience"
      )
      expect(page).to have_text("Waiting for the next activity...")
    end

    # Present the poll block
    visit current_path
    within("li[aria-label='block 1']") { find("button", text: /poll/).click }
    click_button "Present"

    ## Each participant selects a different option
    using_session(:participant) do
      find("label", text: "Team A").click
      click_button "Submit"

      expect(page).to have_text("Team A")
    end

    using_session(:participant_two) do
      find("label", text: "Team B").click
      click_button "Submit"

      expect(page).to have_text("Team B")
    end

    ## Assert participants were assigned to their respective segments
    visit current_path
    within_participants_panel do
      within("tr", text: "Alice") do
        expect(page).to have_text("Team A")
      end
      within("tr", text: "Bob") do
        expect(page).to have_text("Team B")
      end
    end

    ## Create an announcement scoped to Team A
    click_button "Block"
    expect(page).to have_text("Create Block")
    select "Announcement", from: "Kind"
    fill_in "Announcement Message", with: "Hello Team A!"
    click_button "View Additional Details"
    find(:xpath, '//label[contains(., "Visible to segments")]/following-sibling::div/select').select("Team A")
    click_button "Queue block"
    expect(page).to have_css("li[aria-label='block 2']")

    within("li[aria-label='block 2']") { find("button", text: /announcement/).click }
    click_button "Present"

    using_session(:participant) do
      expect(page).to have_text("Hello Team A!")
    end

    using_session(:participant_two) do
      expect(page).to have_text("Waiting for the next activity...")
    end

    ## Create an announcement scoped to Team B
    visit current_path
    click_button "Block"
    expect(page).to have_text("Create Block")
    select "Announcement", from: "Kind"
    fill_in "Announcement Message", with: "Hello Team B!"
    click_button "View Additional Details"
    find(:xpath, '//label[contains(., "Visible to segments")]/following-sibling::div/select').select("Team B")
    click_button "Queue block"
    expect(page).to have_css("li[aria-label='block 3']")

    within("li[aria-label='block 3']") { find("button", text: /announcement/).click }
    click_button "Present"

    using_session(:participant_two) do
      expect(page).to have_text("Hello Team B!")
    end

    using_session(:participant) do
      expect(page).to have_text("Waiting for the next activity...")
    end
  end
end
