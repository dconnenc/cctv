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
      expect(page).to have_text(/Team A/i)

      click_button "+ Add"
      fill_in placeholder: "Segment name", with: "Team B"
      click_button "Add"
      expect(page).to have_text(/Team B/i)
    end

    # Create a poll block with each option assigned to a segment
    queue_block(n: 1) do
      select "Poll", from: "Kind"
      fill_in "Poll Question", with: "Pick your team"
      fill_in "Option 1", with: "Team A"
      fill_in "Option 2", with: "Team B"

      expect(page).to have_css("select[aria-label='Assign segment for option 1']")
      find("select[aria-label='Assign segment for option 1']").select("Team A")
      find("select[aria-label='Assign segment for option 2']").select("Team B")
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
    select_and_present(1, kind: "poll")

    ## Each participant selects a different option
    using_session(:participant) do
      find("label", text: "Team A").click
      click_button "Submit"

      expect(page).to have_text(/Team A/i)
    end

    using_session(:participant_two) do
      find("label", text: "Team B").click
      click_button "Submit"

      expect(page).to have_text(/Team B/i)
    end

    ## Assert participants were assigned to their respective segments
    visit current_path
    within_participants_panel do
      within("tr", text: "Alice") do
        expect(page).to have_text(/Team A/i)
      end
      within("tr", text: "Bob") do
        expect(page).to have_text(/Team B/i)
      end
    end

    ## Create an announcement scoped to Team A
    queue_block(n: 2) do
      select "Announcement", from: "Kind"
      fill_in "Announcement Message", with: "Hello Team A!"
      click_button "View Additional Details"
      find("select[aria-label='Visible to segments']").select("Team A")
    end

    select_and_present(2, kind: "announcement")

    using_session(:participant) do
      expect(page).to have_text("Hello Team A!")
    end

    using_session(:participant_two) do
      expect(page).to have_text("Waiting for the next activity...")
    end

    ## Create an announcement scoped to Team B
    visit current_path
    queue_block(n: 3) do
      select "Announcement", from: "Kind"
      fill_in "Announcement Message", with: "Hello Team B!"
      click_button "View Additional Details"
      find("select[aria-label='Visible to segments']").select("Team B")
    end

    select_and_present(3, kind: "announcement")

    using_session(:participant_two) do
      expect(page).to have_text("Hello Team B!")
    end

    using_session(:participant) do
      expect(page).to have_text("Waiting for the next activity...")
    end
  end

  describe "editing a poll block" do
    before do
      sign_in(admin)
      create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

      queue_block(n: 1) do
        select "Poll", from: "Kind"
        fill_in "Poll Question", with: "Original question?"
        fill_in "Option 1", with: "yes"
        fill_in "Option 2", with: "no"
      end

      select_block(1, kind: "poll")
    end

    context "without responses" do
      it "saves without a confirmation prompt" do
        edit_block

        fill_in "Poll Question", with: "Updated question?"
        click_button "Save"

        select_block(1, kind: "poll")
        expect(page).to have_text("Updated question?")
      end
    end

    context "with responses" do
      before do
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
        select_and_present(1, kind: "poll")

        using_session(:participant) do
          expect(page).to have_button("Submit", disabled: false)
          find("label", text: "yes").click
          click_button "Submit"
          expect(page).to have_text("yes")
        end

        visit current_path
        select_block(1, kind: "poll")
      end

      it "shows a warning when saving and saves after confirmation" do
        edit_block

        fill_in "Poll Question", with: "Updated question?"
        click_button "Save"

        expect(page).to have_text("response has already been submitted")
        click_button "Save Anyway"

        select_block(1, kind: "poll")
        expect(page).to have_text("Updated question?")
      end

      it "warns, clears responses, and saves when poll options are changed" do
        edit_block

        fill_in "Option 1", with: "maybe"
        click_button "Save"

        expect(page).to have_text("response has already been submitted")
        click_button "Save Anyway"

        select_block(1, kind: "poll")
        expect(page).to have_text("Responses (0)")
      end
    end
  end
end
