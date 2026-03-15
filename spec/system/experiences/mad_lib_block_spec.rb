require "rails_helper"

RSpec.describe "Mad Lib Block", type: :system do
  let(:admin) { create(:user, :admin) }

  it "presents a question to the assigned participant, hides it from others, and shows the completed mad lib on the monitor" do
    sign_in(admin)
    create_experience_and_go_to_manage(
      name: "Test Experience", code: "test-exp"
    )

    click_button "Start"
    expect(page).to have_button("Pause")

    using_session(:alice) do
      register_participant(
        code: "test-exp",
        name: "Alice",
        email: "alice@example.com",
        experience_name: "Test Experience"
      )
      expect(page).to have_text("Waiting for the next activity...")
    end

    using_session(:bob) do
      register_participant(
        code: "test-exp",
        name: "Bob",
        email: "bob@example.com",
        experience_name: "Test Experience"
      )
      expect(page).to have_text("Waiting for the next activity...")
    end

    visit current_path
    click_button "Block"
    expect(page).to have_text("Create Block")
    select "Mad Lib", from: "Kind"

    click_button "Add Variable"
    fill_in "Variable Name", with: "adjective"
    fill_in "Question to ask user", with: "Enter an adjective"
    select "Alice", from: "Assign to participant"

    click_button "Queue block"
    expect(page).to have_css("li[aria-label='block 1']")

    sleep 2
    within("li[aria-label='block 1']") { find("button", text: /mad_lib/i).click }
    click_button "Present"

    # Alice sees the question assigned to her
    using_session(:alice) do
      expect(page).to have_text("adjective")
      expect(page).to have_button("Submit")
    end

    # Bob is not assigned a variable — he sees the mad lib with the blank
    using_session(:bob) do
      expect(page).to have_no_button("Submit")
    end

    # Alice submits her word
    using_session(:alice) do
      find("input[type='text']").fill_in with: "fluffy"
      click_button "Submit"
    end

    # Monitor shows the completed mad lib with Alice's word
    using_session(:monitor) do
      visit "/experiences/test-exp/monitor"
      expect(page).to have_text("fluffy")
    end
  end
end
