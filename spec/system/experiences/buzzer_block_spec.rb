require "rails_helper"

RSpec.describe "Buzzer Block", type: :system do
  let(:admin) { create(:user, :admin) }

  it "shows the custom prompt on the monitor views and the buzzer to participants" do
    sign_in(admin)
    create_experience_and_go_to_manage(
      name: "Test Experience", code: "test-exp"
    )

    click_button "Block"
    expect(page).to have_text("Create Block")
    select "Buzzer", from: "Kind"
    fill_in "Prompt", with: "Get ready to buzz in!"
    fill_in "Button Label (optional)", with: "Hit it!"
    click_button "QUEUE BLOCK"
    expect(page).to have_css("li[aria-label='block 1']")

    click_button "START"
    expect(page).to have_button("PAUSE")

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
    within("li[aria-label='block 1']") { find("button", text: /buzzer/i).click }
    click_button "PRESENT"

    # Monitor impersonation view shows the custom prompt
    within("[aria-label='Preview mode']") { click_button "Monitor" }
    expect(page).to have_text("Get ready to buzz in!")

    # Actual monitor page shows the custom prompt
    using_session(:monitor) do
      visit "/experiences/test-exp/monitor"
      expect(page).to have_text("Get ready to buzz in!")
    end

    # Participant sees the buzzer
    using_session(:participant) do
      expect(page).to have_text("Hit it!")
      expect(page).to have_css("button[aria-label='Buzz in']")
    end
  end

  it "shows the winner's prompt, avatar, and name on the monitor after the first participant buzzes, and allows a second participant to also buzz" do
    sign_in(admin)
    create_experience_and_go_to_manage(
      name: "Test Experience", code: "test-exp"
    )

    click_button "Block"
    expect(page).to have_text("Create Block")
    select "Buzzer", from: "Kind"
    fill_in "Prompt", with: "Get ready to buzz in!"
    fill_in "Button Label (optional)", with: "Hit it!"
    click_button "QUEUE BLOCK"
    expect(page).to have_css("li[aria-label='block 1']")

    click_button "START"
    expect(page).to have_button("PAUSE")

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

    visit current_path
    within("li[aria-label='block 1']") { find("button", text: /buzzer/i).click }
    click_button "PRESENT"

    using_session(:participant) do
      expect(page).to have_css("button[aria-label='Buzz in']")
      find("button[aria-label='Buzz in']").click
      expect(page).to have_text(/buzzed!/i)
      expect(page).to have_no_css("button[aria-label='Buzz in']")
    end

    # Bob's buzzer is still available after Alice has buzzed
    using_session(:participant_two) do
      expect(page).to have_css("button[aria-label='Buzz in']")
      find("button[aria-label='Buzz in']").click
      expect(page).to have_text(/buzzed!/i)
      expect(page).to have_no_css("button[aria-label='Buzz in']")
    end

    # Monitor shows the prompt, then Alice's avatar area and name — she was first to buzz
    using_session(:monitor) do
      visit "/experiences/test-exp/monitor"
      expect(page).to have_text("Get ready to buzz in!")
      expect(page).to have_text("Alice")
      expect(page).to have_no_text("Bob")
    end
  end
end