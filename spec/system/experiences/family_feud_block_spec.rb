require "rails_helper"

RSpec.describe "Family Feud Block", type: :system do
  let(:admin) { create(:user, :admin) }

  describe "editing a family feud block" do
    before do
      sign_in(admin)
      create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

      click_button "Block"
      expect(page).to have_text("Create Block")
      select "Family Feud", from: "Kind"
      fill_in "Title", with: "Original Title"
      click_button "Add Question"
      fill_in "Enter question", with: "Name a fruit"
      click_button "Queue block"
      expect(page).to have_css("li[aria-label='block 1']")

      within("li[aria-label='block 1']") { find("button", text: /family.feud/i).click }
    end

    context "without responses" do
      it "saves without a confirmation prompt" do
        click_button "Edit"
        expect(page).to have_text("Edit Block")

        fill_in "Title", with: "Updated Title"
        click_button "Save"

        expect(page).to have_no_text("Edit Block")
      end
    end

    context "when active" do
      before do
        click_button "Start"
        expect(page).to have_button("Pause")

        visit current_path
        within("li[aria-label='block 1']") { find("button", text: /family.feud/i).click }
        click_button "Present"

        within("li[aria-label='block 1']") { find("button", text: /family.feud/i).click }
      end

      it "shows a warning that the block is active and saves after confirmation" do
        click_button "Edit"
        expect(page).to have_text("Edit Block")

        fill_in "Title", with: "Updated Title"
        click_button "Save"

        expect(page).to have_text("currently active")
        click_button "Save Anyway"

        expect(page).to have_no_text("Edit Block")
      end
    end
  end
end
