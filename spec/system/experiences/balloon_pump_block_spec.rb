require "rails_helper"

RSpec.describe "Balloon Pump Minigame", type: :system do
  let(:admin) { create(:user, :admin) }

  # Performs `count` full top-to-bottom drags on the participant's pump canvas.
  # A full stroke clamps the handle across its whole travel, which Pump.tsx
  # converts to exactly 10 fill units. The sleep lets the handle spring back to
  # the top so the next stroke starts from a known position and also yields 10.
  def pump_strokes(count)
    expect(page).to have_css("canvas", wait: 10)
    rect = page.evaluate_script(
      "(() => { const r = document.querySelector('canvas').getBoundingClientRect(); " \
        "return { x: r.x, y: r.y, width: r.width, height: r.height }; })()"
    )
    cx = (rect["x"] + rect["width"] / 2).to_i
    top = (rect["y"] + 6).to_i
    bottom = (rect["y"] + rect["height"] - 6).to_i
    mouse = page.driver.browser.mouse

    count.times do
      mouse.move(x: cx, y: top)
      mouse.down
      mouse.move(x: cx, y: bottom)
      mouse.up
      sleep 0.5
    end
  end

  it "plays a full round across four participants and shows the podium with the winner, two runners-up, and excludes the lowest fill" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Balloon Party", code: "balloon-exp")

    # A full stroke is 10 units, so 40 units = 4 strokes to burst.
    queue_block(n: 1) do
      select "Minigame: Balloon Pump", from: "Kind"
      fill_in "Target units to fill the balloon", with: "40"
    end

    start_experience

    {
      participant: "Alice",
      participant_two: "Bob",
      participant_three: "Carol",
      participant_four: "Dave"
    }.each do |session, name|
      using_session(session) do
        register_participant(
          code: "balloon-exp",
          name: name,
          email: "#{name.downcase}@example.com",
          experience_name: "Balloon Party"
        )
        expect(page).to have_text("Waiting for the next activity...")
      end
    end

    # Present and start the minigame from the host's manage view.
    visit current_path
    select_and_present(1, kind: "balloon")

    expect(page).to have_button("Start minigame")
    click_button "Start minigame"
    expect(page).to have_button("End minigame")

    # While the game runs, the monitor prompts players to pump.
    using_session(:monitor) do
      visit "/experiences/balloon-exp/monitor"
      expect(page).to have_text("Pump to fill your balloon!")
    end

    # The non-winners pump first so their fills are recorded before the game
    # ends: Bob 30 (silver), Carol 20 (bronze), Dave 10 (just misses the podium).
    using_session(:participant_two) do
      pump_strokes(3)
      expect(page).to have_text("30 / 40")
    end

    using_session(:participant_three) do
      pump_strokes(2)
      expect(page).to have_text("20 / 40")
    end

    using_session(:participant_four) do
      pump_strokes(1)
      expect(page).to have_text("10 / 40")
    end

    # Alice fills to the target — her balloon bursts and ends the game.
    using_session(:participant) do
      pump_strokes(4)
      expect(page).to have_text("BURST! You did it")
    end

    # A non-winner is told the game is over once the burst ends it.
    using_session(:participant_four) do
      expect(page).to have_text("Game over")
    end

    # The monitor swaps to the podium: Alice gold, Bob silver, Carol bronze.
    # Dave had the lowest fill and does not make the three-place podium.
    using_session(:monitor) do
      expect(page).to have_text("BURST!")
      expect(page).to have_text("GOLD")
      expect(page).to have_text("SILVER")
      expect(page).to have_text("BRONZE")
      expect(page).to have_text("Alice")
      expect(page).to have_text("Bob")
      expect(page).to have_text("Carol")
      expect(page).to have_no_text("Dave")
    end
  end
end
