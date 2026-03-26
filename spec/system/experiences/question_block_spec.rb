require "rails_helper"

RSpec.describe "Question Block", type: :system do
  let(:admin) { create(:user, :admin) }

  it "presents a question to participants and shows their submitted answer" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

    queue_block(n: 1) do
      select "Question", from: "Kind"
      fill_in "Question", with: "What is your favorite color?"
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
    select_block(1, kind: "question")
    present_block

    using_session(:participant) do
      expect(page).to have_text("What is your favorite color?")
      expect(page).to have_button("Submit", disabled: false)
      fill_in "What is your favorite color?", with: "blue"
      click_button "Submit"
      expect(page).to have_text("blue")
    end
  end

  describe "editing a question block" do
    before do
      sign_in(admin)
      create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

      queue_block(n: 1) do
        select "Question", from: "Kind"
        fill_in "Question", with: "Original question?"
      end

      select_block(1, kind: "question")
    end

    context "without responses" do
      it "saves without a confirmation prompt" do
        click_button "Edit"
        expect(page).to have_text("Edit Block")

        fill_in "Question", with: "Updated question?"
        click_button "Save"

        select_block(1, kind: "question")
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
        select_block(1, kind: "question")
        present_block

        using_session(:participant) do
          expect(page).to have_button("Submit", disabled: false)
          fill_in "Original question?", with: "blue"
          click_button "Submit"
          expect(page).to have_text("blue")
        end

        visit current_path
        select_block(1, kind: "question")
      end

      it "shows a warning when saving and saves after confirmation" do
        click_button "Edit"
        expect(page).to have_text("Edit Block")

        fill_in "Question", with: "Updated question?"
        click_button "Save"

        expect(page).to have_text("response has already been submitted")
        click_button "Save Anyway"

        select_block(1, kind: "question")
        expect(page).to have_text("Updated question?")
      end
    end
  end
end
