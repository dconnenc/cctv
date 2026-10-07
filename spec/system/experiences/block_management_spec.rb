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

      edit_block
      click_button "View Additional Details"
      expect(page).to have_field("Show on monitor", checked: true)
      uncheck "Show on monitor"
      click_button "Save"
      expect(page).to have_no_text("Edit Block")

      # Monitor impersonation view shows empty state even when block is queued but not live
      switch_to_monitor_preview
      expect(page).to have_text("This block is not shown on the monitor")

      present_block

      # Monitor impersonation view still shows empty state after block goes live
      switch_to_monitor_preview
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

  end
end
