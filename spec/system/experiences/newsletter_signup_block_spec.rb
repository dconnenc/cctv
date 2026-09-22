require "rails_helper"

RSpec.describe "Newsletter Signup Block", type: :system do
  let(:admin) { create(:user, :admin) }

  # The subscribe job runs in the embedded Sidekiq process during system specs.
  # Stub the outbound Sender call so no real HTTP request is made.
  before do
    allow(Newsletter::SenderClient).to receive(:subscribe).and_return(true)
  end

  it "lets a participant subscribe, persists the confirmation after a page reload, and calls Sender" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

    queue_block(n: 1) do
      select "Newsletter Signup", from: "Kind"
      fill_in "Prompt", with: "Can we email you?"
      fill_in "Confirmation message (optional)", with: "You are subscribed!"
    end

    start_experience

    using_session(:participant) do
      register_participant(
        code: "test-exp",
        name: "Alice Adams",
        email: "alice@example.com",
        experience_name: "Test Experience"
      )
      expect(page).to have_text("Waiting for the next activity...")
    end

    visit current_path
    select_and_present(1, kind: "newsletter_signup")

    # Monitor shows the prompt only
    using_session(:monitor) do
      visit "/experiences/test-exp/monitor"
      expect(page).to have_text("Can we email you?")
    end

    using_session(:participant) do
      expect(page).to have_text("Can we email you?")
      click_button "Yes, sign me up"
      expect(page).to have_text("You are subscribed!")

      # A full page reload triggers a WebSocket reconnect. On subscribe the server
      # sends a submission_state message with all prior submissions keyed by block
      # ID; the frontend rehydrates the confirmation from that, so the "Yes, sign
      # me up" button never appears.
      visit current_path
      expect(page).to have_text("You are subscribed!")
      expect(page).to have_no_button("Yes, sign me up")
    end

    expect(Newsletter::SenderClient).to have_received(:subscribe).with(
      email: "alice@example.com",
      firstname: "Alice",
      lastname: "Adams"
    )

    # Host sees the aggregate response count on the manage program table
    visit current_path
    select_block(1, kind: "newsletter_signup")
    expect(page).to have_text("1 response")
  end

  it "records a decline without subscribing to Sender" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

    queue_block(n: 1) do
      select "Newsletter Signup", from: "Kind"
      fill_in "Prompt", with: "Can we email you?"
      fill_in "Decline message (optional)", with: "Maybe another time."
    end

    start_experience

    using_session(:participant) do
      register_participant(
        code: "test-exp",
        name: "Bob",
        email: "bob@example.com",
        experience_name: "Test Experience"
      )
      expect(page).to have_text("Waiting for the next activity...")
    end

    visit current_path
    select_and_present(1, kind: "newsletter_signup")

    using_session(:participant) do
      expect(page).to have_text("Can we email you?")
      click_button "No thanks"
      expect(page).to have_text("Maybe another time.")
    end

    expect(Newsletter::SenderClient).not_to have_received(:subscribe)
  end
end
