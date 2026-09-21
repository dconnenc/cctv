require "rails_helper"

RSpec.describe "Feedback", type: :system do
  let(:admin) { create(:user, :admin) }

  # Capybara reports a button as present even when another fixed element covers
  # it, so overlap is checked by asking the page what is actually at that point.
  def feedback_trigger_state
    page.evaluate_script(<<~JS)
      (() => {
        const el = document.querySelector("button[aria-label='Give feedback']");
        if (!el) return "missing";
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return el === hit || el.contains(hit) ? "reachable" : "covered";
      })()
    JS
  end

  it "lets a participant send feedback without leaving the experience" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

    queue_block(n: 1) do
      select "Announcement", from: "Kind"
      fill_in "Message", with: "Welcome to the show"
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
    select_and_present(1, kind: "announcement")

    using_session(:participant) do
      expect(page).to have_text("Welcome to the show")

      expect(page).to have_button("Give feedback")

      # The experience page anchors its own playbill FAB in this corner, so the
      # trigger has to stack clear of it rather than sit underneath.
      expect(feedback_trigger_state).to eq("reachable")

      click_button "Give feedback"

      expect(page).to have_text("Tell us what is broken, confusing, or missing.")
      fill_in "Title (optional)", with: "Audio cut out"
      fill_in "What happened?", with: "The announcement appeared but the sound never played."

      expect(page).to have_button("Send feedback", disabled: false)
      click_button "Send feedback"

      expect(page).to have_text("Thanks — this is on our list.")

      # The experience is still running behind the drawer: feedback is an
      # overlay, not a navigation.
      expect(page).to have_text("Welcome to the show")
    end
  end

  it "collects responses through a feedback block and confirms submission" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

    queue_block(n: 1) do
      select "Feedback", from: "Kind"
      fill_in "Prompt", with: "How was the show?"
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
    select_and_present(1, kind: "feedback")

    using_session(:monitor) do
      visit "/experiences/test-exp/monitor"
      expect(page).to have_text("How was the show?")
    end

    using_session(:participant) do
      expect(page).to have_text("How was the show?")

      fill_in "What happened?", with: "Loved the second half."

      expect(page).to have_button("Submit", disabled: false)
      click_button "Submit"

      expect(page).to have_text("Thanks for the feedback")
    end
  end

  it "does not offer the feedback trigger on the monitor" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

    using_session(:monitor) do
      visit "/experiences/test-exp/monitor"

      expect(page).to have_text("Test Experience")
      expect(page).to have_no_button("Give feedback")
    end
  end
end
