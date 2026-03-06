require "rails_helper"

RSpec.describe "Managing Blocks", type: :system do
  let(:admin) { create(:user, :admin) }
  let!(:experience) do
    create(
      :experience,
      :draft,
      creator: admin,
      name: "Management Experience",
      code: "management-experience"
    )
  end

  let(:participant_name) { "Test Player"  }

  before do
    create(
      :experience_participant,
      :player,
      name: participant_name,
      experience: experience
    )
  end

  describe "enqueing and presenting blocks" do
    before do
      sign_in(admin)
    end

    it "hides announcement from monitor when show_on_monitor is disabled" do
      visit "/experiences/#{experience.code_slug}/manage"

      click_button "Start"
      expect(page).to have_button("Pause")

      click_button "Block"
      expect(page).to have_text("Create Block")
      select "Announcement", from: "Kind"
      fill_in(
        "Announcement Message",
        with: "Hidden announcement {{ participant_name }}"
      )
      uncheck "Show on monitor"
      click_button "Queue block"
      expect(page).to have_css("li[aria-label='block 1']")

      within("li[aria-label='block 1']") do
        find("button", text: /announcement/).click
      end
      click_button "Present"

      # Participant impersonation view shows the announcement
      within("[aria-label='Preview mode']") { click_button "Participant" }
      expect(page).to have_select("View as participant")
      select "#{participant_name} (player)", from: "View as participant"
      expect(page).to have_text("Hidden announcement #{participant_name}")

      # Monitor impersonation view shows empty state
      within("[aria-label='Preview mode']") { click_button "Monitor" }
      expect(page).to have_text("This block is not shown on the monitor")

      # Actual monitor page still shows lobby state
      using_session(:monitor) do
        visit "/experiences/#{experience.code_slug}/monitor"
        expect(page).to have_css(
          "img[alt='QR code for joining Management Experience']"
        )
        expect(page).not_to have_text("Hidden announcement")
      end
    end

    it "shows the correct impersonation views" do
      visit "/experiences/#{experience.code_slug}/manage"

      # Start the experience
      click_button "Start"
      expect(page).to have_button("Pause")

      # Enqueue new block
      click_button "Block"
      expect(page).to have_text("Create Block")
      select "Announcement", from: "Kind"
      fill_in(
        "Announcement Message",
        with: "Welcome {{ participant_name }}"
      )
      click_button "Queue block"
      expect(page).to have_css("li[aria-label='block 1']")

      # Assert UI isn't showing anything (no block is live)
      # NOTE: This isn't a UI showing "no live blocks". Only a default state
      # for a newly created experience. This should be a "no live blocks" state
      #  in the future
      expect(page).to have_text(
        "Select a block from the sidebar to view details"
      )

      # Start presenting the block
      within("li[aria-label='block 1']") do
        find("button", text: /announcement/).click
      end
      click_button "Present"

      # Assert impersonation and monitor views
      within("[aria-label='Preview mode']") { click_button "Participant" }
      expect(page).to have_select("View as participant")
      select "#{participant_name} (player)", from: "View as participant"
      expect(page).to have_text("Welcome #{participant_name}")
      within("[aria-label='Preview mode']") { click_button "Monitor" }
      expect(page).to have_text("Welcome {{ participant_name }}")

      # Queue new block
      click_button "Block"
      expect(page).to have_text("Create Block")
      select "Announcement", from: "Kind"
      fill_in(
        "Announcement Message",
        with: "Welcome {{ participant_name }} again"
      )
      click_button "Queue block"
      expect(page).to have_css("li[aria-label='block 2']")

      # Assert original block is still displayed. New block is only enqueued
      within("[aria-label='Preview mode']") { click_button "Monitor" }
      expect(page).to have_text("Welcome {{ participant_name }}")

      # Present new block
      within("li[aria-label='block 2']") do
        find("button", text: /announcement/).click
      end
      click_button "Present"

      # Assert new block is now visible in the impersonation views
      within("[aria-label='Preview mode']") { click_button "Participant" }
      expect(page).to have_select("View as participant")
      select "#{participant_name} (player)", from: "View as participant"
      expect(page).to have_text("Welcome #{participant_name} again")
      within("[aria-label='Preview mode']") { click_button "Monitor" }
      expect(page).to have_text("Welcome {{ participant_name }} again")
    end
  end
end
