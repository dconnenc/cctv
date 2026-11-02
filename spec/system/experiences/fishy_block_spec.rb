require "rails_helper"

RSpec.describe "Fishy Minigame", type: :system do
  let(:admin) { create(:user, :admin) }

  it "runs a round from countdown to podium across participants, the monitor, and a reconnect" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Fish Night", code: "fishy-exp")

    queue_block(n: 1) do
      select "Minigame: Fishy", from: "Kind"
      fill_in "Title", with: "Fishbowl Brawl"
      fill_in "Player cap (2–100)", with: "10"
    end

    start_experience

    { participant: "Alice", participant_two: "Bob" }.each do |session, name|
      using_session(session) do
        register_participant(
          code: "fishy-exp",
          name: name,
          email: "#{name.downcase}@example.com",
          experience_name: "Fish Night"
        )
        expect(page).to have_text("Waiting for the next activity...")
      end
    end

    visit current_path
    select_and_present(1, kind: "fishy")

    using_session(:participant) do
      expect(page).to have_text("Get ready…")
    end

    expect(page).to have_button("Start Fishy", disabled: false)
    click_button "Start Fishy"
    expect(page).to have_button("End now (biggest wins)")

    # After the countdown both players are in the bowl.
    using_session(:participant) do
      expect(page).to have_css("canvas")
      expect(page).to have_text("2 swimming", wait: 10)
    end

    using_session(:monitor) do
      visit "/experiences/fishy-exp/monitor"
      expect(page).to have_text("Fishbowl Brawl")
      expect(page).to have_text("2 swimming", wait: 10)
    end

    # A reconnecting player is rehydrated from the subscribe keyframe.
    using_session(:participant_two) do
      visit current_path
      expect(page).to have_css("canvas", wait: 10)
      expect(page).to have_text("2 swimming", wait: 10)
    end

    click_button "End now (biggest wins)"
    expect(page).to have_button("Restart")

    using_session(:monitor) do
      expect(page).to have_text("rules the bowl!")
      expect(page).to have_text("GOLD")
      expect(page).to have_text("SILVER")
    end

    using_session(:participant) do
      expect(page).to have_text(/You (won!|placed #2)/)
    end
  end
end
