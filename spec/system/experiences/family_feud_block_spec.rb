require "rails_helper"

RSpec.describe "Family Feud Block", type: :system do
  let(:admin) { create(:user, :admin) }

  it "shows the title on the monitor when first presented, even with segment visibility rules" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

    # Intentionally keep the default Audience segment to reproduce the monitor
    # visibility bug where segment rules caused the block to be hidden from monitor.
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
