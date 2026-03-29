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

  describe "generic block behaviors" do
    before do
      sign_in(admin)
    end

    it "hides announcement from monitor when show_on_monitor is disabled" do
      visit "/experiences/#{experience.code_slug}/manage"

      start_experience

      queue_block(n: 1) do
        select "Announcement", from: "Kind"
        fill_in(
          "Announcement Message",
          with: "Hidden announcement {{ participant_name }}"
        )
      end

      select_block(1, kind: "announcement")

      click_button "Edit"
      expect(page).to have_text("Edit Block")
      click_button "View Additional Details"
      expect(page).to have_field("Show on monitor", checked: true)
      uncheck "Show on monitor"
      click_button "Save"
      expect(page).to have_no_text("Edit Block")

      # Monitor impersonation view shows empty state even when block is queued but not live
      within("[aria-label='Preview mode']") { click_button "Monitor" }
      expect(page).to have_text("This block is not shown on the monitor")

      present_block

      # Monitor impersonation view still shows empty state after block goes live
      within("[aria-label='Preview mode']") { click_button "Monitor" }
      expect(page).to have_text("This block is not shown on the monitor")

      # Participant impersonation view shows the announcement
      within("[aria-label='Preview mode']") { click_button "Participant" }
      expect(page).to have_select("View as participant")
      select "#{participant_name} (player)", from: "View as participant"
      expect(page).to have_text("Hidden announcement #{participant_name}")

      # Monitor impersonation view shows empty state
      within("[aria-label='Preview mode']") { click_button "Monitor" }
      expect(page).to have_text("This block is not shown on the monitor")

      # Actual monitor page still shows lobby state with participant notification
      using_session(:monitor) do
        visit "/experiences/#{experience.code_slug}/monitor"
        expect(page).to have_css(
          "img[alt='QR code for joining Management Experience']"
        )
        expect(page).to have_no_text("Hidden announcement")
        expect(page).to have_text("Check your devices")
      end
    end

    it "shows the correct impersonation views" do
      visit "/experiences/#{experience.code_slug}/manage"

      start_experience

      queue_block(n: 1) do
        select "Announcement", from: "Kind"
        fill_in(
          "Announcement Message",
          with: "Welcome {{ participant_name }}"
        )
      end

      # Assert UI isn't showing anything (no block is live)
      # NOTE: This isn't a UI showing "no live blocks". Only a default state
      # for a newly created experience. This should be a "no live blocks" state
      #  in the future
      expect(page).to have_text(
        "Select a block from the sidebar to view details"
      )

      # Start presenting the block
      select_and_present(1, kind: "announcement")

      # Assert impersonation and monitor views
      within("[aria-label='Preview mode']") { click_button "Participant" }
      expect(page).to have_select("View as participant")
      select "#{participant_name} (player)", from: "View as participant"
      expect(page).to have_text("Welcome #{participant_name}")
      within("[aria-label='Preview mode']") { click_button "Monitor" }
      expect(page).to have_text("Welcome {{ participant_name }}")

      # Queue new block
      queue_block(n: 2) do
        select "Announcement", from: "Kind"
        fill_in(
          "Announcement Message",
          with: "Welcome {{ participant_name }} again"
        )
      end

      # Assert original block is still displayed. New block is only enqueued
      within("[aria-label='Preview mode']") { click_button "Monitor" }
      expect(page).to have_text("Welcome {{ participant_name }}")

      # Present new block
      select_block(2, kind: "announcement")
      present_block

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
