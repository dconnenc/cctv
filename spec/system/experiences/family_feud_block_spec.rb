require "rails_helper"

RSpec.describe "Family Feud Block", type: :system do
  let(:admin) { create(:user, :admin) }

  it "shows the title on the monitor when first presented" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

    queue_block(n: 1) do
      select "Family Feud", from: "Kind"
      fill_in "Title", with: "Jun 7th FF"
      click_button "Add Question"
      fill_in "Enter question", with: "Name a fruit"
    end

    start_experience

    select_and_present(1, kind: "family.feud")

    within("[aria-label='Preview mode']") { click_button "Monitor" }
    expect(page).to have_text("Jun 7th FF")

    using_session(:monitor) do
      visit "/experiences/test-exp/monitor"
      expect(page).to have_text("Jun 7th FF")
    end
  end

  describe "full gathering, categorizing, and playing lifecycle" do
    it "presents all questions as live, gathers answers, creates buckets, then plays and reveals" do
      sign_in(admin)
      create_experience_and_go_to_manage(name: "Survey Night", code: "survey-night")

      queue_block(n: 1) do
        select "Family Feud", from: "Kind"
        fill_in "Title", with: "Name Something"
        click_button "Add Question"
        expect(page).to have_field("Question 1")
        fill_in "Question 1", with: "Name a fruit"
        click_button "Add Question"
        expect(page).to have_field("Question 2")
        fill_in "Question 2", with: "Name a color"
      end

      start_experience

      using_session(:participant) do
        register_participant(
          code: "survey-night",
          name: "Alice",
          email: "alice@example.com",
          experience_name: "Survey Night"
        )
        expect(page).to have_text("Waiting for the next activity...")
      end

      visit current_path
      select_and_present(1, kind: "family.feud")

      # Opening a family feud block opens the parent and all child question blocks atomically;
      # each should display the Live badge in the sidebar.
      within("li[aria-label='block 1']") { expect(page).to have_text("LIVE") }
      within("li[aria-label='block 2']") { expect(page).to have_text("LIVE") }
      within("li[aria-label='block 3']") { expect(page).to have_text("LIVE") }

      # Monitor (both preview and live page) shows the gathering-phase title
      within("[aria-label='Preview mode']") { click_button "Monitor" }
      expect(page).to have_text("Name Something")

      using_session(:monitor) do
        visit "/experiences/survey-night/monitor"
        expect(page).to have_text("Name Something")
      end

      # Participant cycles through both questions in order, then sees only the title
      using_session(:participant) do
        expect(page).to have_field("Name a fruit")
        fill_in "Name a fruit", with: "Banana"
        expect(page).to have_button("Submit", disabled: false)
        click_button "Submit"

        expect(page).to have_field("Name a color")
        fill_in "Name a color", with: "Blue"
        expect(page).to have_button("Submit", disabled: false)
        click_button "Submit"

        # All questions answered — participant sees only the family feud title
        expect(page).to have_text("Name Something")
        expect(page).to have_no_field("Name a fruit")
      end

      # Admin creates a bucket for the first question
      # (Drag-and-drop assignment of answers to buckets is not covered here
      #  due to the unreliability of DnD interactions in browser tests.)
      visit current_path
      select_block(1, kind: "family.feud")
      expect(page).to have_button("Expand Name a fruit")
      click_button "Expand Name a fruit"
      expect(page).to have_button("Collapse Name a fruit")

      expect(page).to have_button("Add Bucket")
      click_button "Add Bucket"
      expect(page).to have_button("Collapse Bucket 1")

      # Admin starts playing — family feud enters its reveal phase
      expect(page).to have_button("Start Playing")
      click_button "Start Playing"

      expect(page).to have_text("Playing Controls")
      expect(page).to have_text("Question 1 of 2")
      expect(page).to have_text("Name a fruit")

      # Admin reveals a bucket — monitor updates to show the revealed answer category
      expect(page).to have_button("Reveal Bucket 1")
      click_button "Reveal Bucket 1"
      expect(page).to have_button("Revealed Bucket 1", disabled: :all)

      using_session(:monitor) do
        expect(page).to have_text("Bucket 1")
      end
    end
  end

  describe "synthetic (AI-generated) questions" do
    before do
      allow(AI::Client).to receive(:call).and_return(
        { "answers" => ["carrot", "broccoli", "carrot", "potato", "broccoli"] }
      )
    end

    it "generates answers from the agent, hides the question from participants, and categorizes like any other" do
      sign_in(admin)
      create_experience_and_go_to_manage(name: "AI Night", code: "ai-night")

      queue_block(n: 1) do
        select "Family Feud", from: "Kind"
        fill_in "Title", with: "Name Something"
        click_button "Add Question"
        fill_in "Question 1", with: "Name a fruit"
        click_button "Add Synthetic Question"
        fill_in "Synthetic Question 2", with: "Name a vegetable"
      end

      start_experience

      using_session(:participant) do
        register_participant(
          code: "ai-night",
          name: "Alice",
          email: "alice@example.com",
          experience_name: "AI Night"
        )
        expect(page).to have_text("Waiting for the next activity...")
      end

      visit current_path
      select_and_present(1, kind: "family.feud")

      # Participant can answer the human question but never sees the synthetic one
      using_session(:participant) do
        expect(page).to have_field("Name a fruit")
        expect(page).to have_no_field("Name a vegetable")
      end

      select_block(1, kind: "family.feud")

      # The synthetic question is presented to the admin and can be dispatched to the agent
      expect(page).to have_button("Expand Name a vegetable")
      click_button "Expand Name a vegetable"

      expect(page).to have_button("Generate Answers")
      click_button "Generate Answers"

      # Generated answers land in the answers column, ready to be categorized
      expect(page).to have_text("Answers (5)")

      # From here it behaves like any other question: buckets are available
      expect(page).to have_button("Add Bucket")
    end
  end

  describe "editing a family feud block" do
    before do
      sign_in(admin)
      create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

      queue_block(n: 1) do
        select "Family Feud", from: "Kind"
        fill_in "Title", with: "Original Title"
        click_button "Add Question"
        fill_in "Enter question", with: "Name a fruit"
      end

      select_block(1, kind: "family.feud")
    end

    context "without responses" do
      it "saves without a confirmation prompt" do
        edit_block

        fill_in "Title", with: "Updated Title"
        click_button "Save"

        expect(page).to have_no_text("Edit Block")
      end
    end

    context "when active" do
      before do
        start_experience

        visit current_path
        select_and_present(1, kind: "family.feud")

        select_block(1, kind: "family.feud")
      end

      it "shows a warning that the block is active and saves after confirmation" do
        edit_block

        fill_in "Title", with: "Updated Title"
        click_button "Save"

        expect(page).to have_text("currently active")
        click_button "Save Anyway"

        expect(page).to have_no_text("Edit Block")
      end
    end
  end
end
