require "rails_helper"

RSpec.describe "Newscasters Block", type: :system do
  let(:admin) { create(:user, :admin) }

  it "creates an independent source block, collects a link, and features it on playback" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

    queue_block(n: 1) do
      select "Newscasters", from: "Kind"
      fill_in "Source prompt", with: "Send us your breaking news clip"
    end

    # Adding a Newscasters block also adds its companion source block, and the
    # two are independent top-level blocks (no parent coupling).
    expect(page).to have_css("li[aria-label='block 2']")
    experience = Experience.find_by!(code: "test-exp")
    kinds = experience.experience_blocks.order(:position).pluck(:kind)
    expect(kinds).to eq([ExperienceBlock::NEWSCASTERS_SOURCE, ExperienceBlock::NEWSCASTERS])
    expect(experience.experience_blocks.where.not(parent_block_id: nil)).to be_empty

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
    select_and_present(1, kind: "newscasters_source")

    # Link-only intake: the participant sees the link field and no upload toggle.
    using_session(:participant) do
      expect(page).to have_text("Send us your breaking news clip")
      expect(page).to have_field("YouTube link")
      expect(page).not_to have_button("Upload")

      fill_in "YouTube link", with: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      click_button "Submit Link"
      expect(page).to have_text(/video submitted/i)
    end

    # Host sees the submission on the playback block and can feature it.
    # (The video is deselected again before presenting so the headless browser
    # never has to load an external YouTube embed.)
    select_block(2, kind: "newscasters")
    expect(page).to have_text("Alice")
    click_button "Select"
    expect(page).to have_button("Deselect")
    click_button "Deselect"
    expect(page).to have_button("Select")

    present_block

    # The playback block shows only a reminder to the audience.
    using_session(:participant) do
      expect(page).to have_text("Watch the show")
    end
  end

  it "offers an upload toggle when direct uploads are enabled" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Upload Experience", code: "upload-exp")

    queue_block(n: 1) do
      select "Newscasters", from: "Kind"
      fill_in "Source prompt", with: "Upload your clip"
      within(:xpath, "//label[contains(., 'Allow direct uploads')]") do
        find("button[role='switch']").click
      end
    end

    start_experience

    using_session(:participant) do
      register_participant(
        code: "upload-exp",
        name: "Bob",
        email: "bob@example.com",
        experience_name: "Upload Experience"
      )
      expect(page).to have_text("Waiting for the next activity...")
    end

    visit current_path
    select_and_present(1, kind: "newscasters_source")

    using_session(:participant) do
      expect(page).to have_text("Upload your clip")
      expect(page).to have_button("Video Link")
      expect(page).to have_button("Upload")
    end
  end
end
