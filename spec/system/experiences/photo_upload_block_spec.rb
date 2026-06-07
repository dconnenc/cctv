require "rails_helper"

RSpec.describe "Photo Upload Block", type: :system do
  let(:admin) { create(:user, :admin) }

  it "presents a photo upload prompt on the monitor and to participants" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

    queue_block(n: 1) do
      select "Photo Upload", from: "Kind"
      fill_in "Prompt", with: "Upload a photo of your workspace"
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
    select_and_present(1, kind: "photo_upload")

    # Monitor impersonation shows the prompt
    within("[aria-label='Preview mode']") { click_button "Monitor" }
    expect(page).to have_text("Upload a photo of your workspace")

    # Actual monitor page shows the prompt
    using_session(:monitor) do
      visit "/experiences/test-exp/monitor"
      expect(page).to have_text("Upload a photo of your workspace")
    end

    # Participant sees the prompt and upload interface
    using_session(:participant) do
      expect(page).to have_text("Upload a photo of your workspace")
      expect(page).to have_text("Tap to select a photo")
    end
  end
end
