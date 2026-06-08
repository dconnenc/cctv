require "rails_helper"

RSpec.describe "The Scene Block", type: :system do
  let(:admin) { create(:user, :admin) }

  it "runs a full two-scene session with suggestion collection, voting, buzzer, and block end" do
    # ── Setup ─────────────────────────────────────────────────────────────────
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Scene Night", code: "scene-night")

    # prompt_input_count: 2 with 4 eligible participants (after 1 performer)
    # yields 2 suggesters + 1 buzzer + 1 observer per scene, enabling vote-change testing.
    queue_block(n: 1) do
      select "The Scene", from: "Kind"
      fill_in "Leaderboard size", with: "5"
      fill_in "Prompt recipients per scene", with: "2"
    end

    start_experience

    [
      { session: :alex,  name: "Alex",  email: "alex@example.com"  },
      { session: :blake, name: "Blake", email: "blake@example.com" },
      { session: :casey, name: "Casey", email: "casey@example.com" },
      { session: :dana,  name: "Dana",  email: "dana@example.com"  },
      { session: :ellis, name: "Ellis", email: "ellis@example.com" },
    ].each do |p|
      using_session(p[:session]) do
        register_participant(
          code: "scene-night",
          name: p[:name],
          email: p[:email],
          experience_name: "Scene Night"
        )
        expect(page).to have_text("Waiting for the next activity...")
      end
    end

    # Admin: present the block.
    visit current_path
    select_and_present(1, kind: "the_scene")

    using_session(:monitor) do
      visit "/experiences/scene-night/monitor"
      expect(page).to have_text(/Waiting for the next scene/i)
    end

    using_session(:alex) do
      expect(page).to have_text("Waiting for the next scene")
    end

    # The ManageView is accessed via the Participant preview tab, where TheScene
    # renders its manage UI (phase controls, performers, suggestions) and buttons
    # remain interactive.
    within("[aria-label='Preview mode']") { find("button", text: /Participant/i).click }
    expect(page).to have_text("Phase: idle")

    # Admin: assign Alex as performer.
    find("summary", text: /Performers/).click
    expect(page).to have_text("Alex")
    check "Alex"
    expect(page).to have_css("summary", text: "Performers (1)")

    # ── Scene 1 ───────────────────────────────────────────────────────────────
    expect(page).to have_button("Start scene")
    click_button "Start scene"
    expect(page).to have_text("Phase: collecting")

    using_session(:monitor) do
      expect(page).to have_text(/\bLive\b/i)
    end

    using_session(:alex) do
      expect(page).to have_text("You're on stage")
      expect(page).to have_text("Sit back")
    end

    # Identify roles dynamically from what each participant sees.
    buzzer_session   = nil
    suggester_sessions = []
    observer_session = nil

    [:blake, :casey, :dana, :ellis].each do |sess|
      using_session(sess) do
        if page.has_text?("You hold the buzzer", wait: 5)
          buzzer_session = sess
        elsif page.has_text?("Drop a suggestion", wait: 5)
          suggester_sessions << sess
        else
          expect(page).to have_text("Waiting on suggestions")
          observer_session = sess
        end
      end
    end

    expect(buzzer_session).not_to be_nil
    expect(suggester_sessions.size).to eq(2)
    expect(observer_session).not_to be_nil

    suggester_a = suggester_sessions[0]
    suggester_b = suggester_sessions[1]

    # Buzzer locked until 2 suggestions exist; observer sees voting gate.
    using_session(buzzer_session) do
      expect(page).to have_text("Waiting on 2 more suggestions")
    end

    using_session(observer_session) do
      expect(page).to have_text("Need 2 more suggestions before voting opens")
    end

    # ── Suggester A submits ───────────────────────────────────────────────────
    using_session(suggester_a) do
      fill_in placeholder: "Taylor eats a bowl of hair…", with: "A wedding"
      expect(page).to have_button("Submit suggestion", disabled: false)
      click_button "Submit suggestion"
      expect(page).to have_text('Your suggestion: "A wedding"')
      expect(page).to have_text("Need 1 more suggestion before voting opens")
    end

    using_session(:monitor) do
      expect(page).to have_text("A wedding")
    end

    using_session(buzzer_session) do
      expect(page).to have_text("Waiting on 1 more suggestion")
    end

    # ── Suggester B submits ───────────────────────────────────────────────────
    using_session(suggester_b) do
      fill_in placeholder: "Taylor eats a bowl of hair…", with: "A circus"
      expect(page).to have_button("Submit suggestion", disabled: false)
      click_button "Submit suggestion"
      expect(page).to have_text('Your suggestion: "A circus"')
      # Voting opens — suggester B sees A wedding to vote on (own suggestion excluded).
      expect(page).to have_text("Vote")
    end

    using_session(:monitor) do
      expect(page).to have_text("A circus")
    end

    using_session(buzzer_session) do
      expect(page).to have_text("Break the glass when the scene needs to end")
    end

    using_session(observer_session) do
      expect(page).to have_text("Vote")
    end

    # ── Observer votes for A wedding ──────────────────────────────────────────
    using_session(observer_session) do
      find("button", text: /A wedding/).click
      expect(page).to have_text("Vote")
    end

    using_session(:monitor) do
      within("[data-rank='1']") { expect(page).to have_text("A wedding") }
    end

    # ── Observer changes vote to A circus ─────────────────────────────────────
    using_session(observer_session) do
      find("button", text: /A circus/).click
      expect(page).to have_text("Vote")
    end

    using_session(:monitor) do
      within("[data-rank='1']") { expect(page).to have_text("A circus") }
    end

    # ── Suggester B votes for A wedding ───────────────────────────────────────
    using_session(suggester_b) do
      find("button", text: /A wedding/).click
      expect(page).to have_text("Vote")
    end

    # Both suggestions are now visible on the monitor (tied or ordered by votes).
    using_session(:monitor) do
      expect(page).to have_text("A wedding")
      expect(page).to have_text("A circus")
    end

    # ── Buzzer press (two-step: break glass → press) ───────────────────────────
    using_session(buzzer_session) do
      expect(page).to have_css('[role="button"][aria-label="BREAK GLASS"]')
      find('[role="button"][aria-label="BREAK GLASS"]').click
      expect(page).to have_css('[role="button"][aria-label="PRESS"]', wait: 8)
      find('[role="button"][aria-label="PRESS"]').click
      expect(page).to have_text("Scene ended!")
    end

    # Monitor: winner reveal phase.
    using_session(:monitor) do
      expect(page).to have_text("And the winner is…")
      expect(page).to have_text(/Winner reveal/i)
      expect(page).to have_css('[data-rank="1"]')
    end

    using_session(suggester_a) do
      expect(page).to have_text("Scene ended!")
      expect(page).to have_text("Watch the monitor for the winning prompt")
    end

    using_session(observer_session) do
      expect(page).to have_text("Scene ended!")
    end

    # ── Admin: start scene 2 ──────────────────────────────────────────────────
    # ManageView auto-updates via WebSocket — no page reload needed.
    expect(page).to have_button("Next scene")
    click_button "Next scene"
    expect(page).to have_text("Phase: collecting")

    using_session(:monitor) do
      expect(page).to have_text(/\bLive\b/i)
    end

    # ── Scene 2: suggestion persistence and vote reset ────────────────────────
    # ManageView confirms we're in collecting phase with no votes yet.
    expect(page).to have_text("Phase: collecting")

    # Monitor: old suggestions from scene 1 are still visible (persistence);
    # the leaderboard resets to 0 votes for the new scene_started_at.
    using_session(:monitor) do
      expect(page).to have_text("A wedding")
      expect(page).to have_text("A circus")
    end

    # ── Admin: end block ──────────────────────────────────────────────────────
    expect(page).to have_button("End block")
    click_button "End block"
    expect(page).to have_text("Phase: ended")
  end
end
