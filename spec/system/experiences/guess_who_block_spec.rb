require "rails_helper"

RSpec.describe "Guess Who Block", type: :system do
  let(:admin) { create(:user, :admin) }

  it "runs a full game with clues, polls, elimination, and reveal" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Guess Night", code: "guess-night")

    # ── Create the pool segment for mystery candidates ─────────────────────────
    within_participants_panel do
      click_button "Add"
      fill_in placeholder: "Segment name", with: "Pool"
      click_button "Add"
      expect(page).to have_text(/pool/i)
    end

    # ── Queue a question block — answers become clues in the game ──────────────
    queue_block(n: 1) do
      select "Question", from: "Kind"
      fill_in "Question", with: "What is your go-to karaoke song?"
    end

    start_experience

    # ── Register participants (2 contestants + 3 pool members) ────────────────
    [
      { session: :alex,  name: "Alex",  email: "alex@example.com"  },
      { session: :blake, name: "Blake", email: "blake@example.com" },
      { session: :casey, name: "Casey", email: "casey@example.com" },
      { session: :dana,  name: "Dana",  email: "dana@example.com"  },
      { session: :ellis, name: "Ellis", email: "ellis@example.com" },
    ].each do |p|
      using_session(p[:session]) do
        register_participant(
          code: "guess-night",
          name: p[:name],
          email: p[:email],
          experience_name: "Guess Night"
        )
        expect(page).to have_text("Waiting for the next activity...")
      end
    end

    # ── Pool members submit answers — these become clues ───────────────────────
    visit current_path
    select_and_present(1, kind: "question")

    [
      { session: :casey, answer: "Bohemian Rhapsody"    },
      { session: :dana,  answer: "Don't Stop Believin'" },
      { session: :ellis, answer: "Livin' on a Prayer"   },
    ].each do |p|
      using_session(p[:session]) do
        expect(page).to have_field("What is your go-to karaoke song?")
        fill_in "What is your go-to karaoke song?", with: p[:answer]
        expect(page).to have_button("Submit", disabled: false)
        click_button "Submit"
        expect(page).to have_text(p[:answer])
      end
    end

    # ── Close the question block ───────────────────────────────────────────────
    visit current_path
    select_block(1, kind: "question")
    stop_presenting_block

    # ── Assign pool members to Pool segment ───────────────────────────────────
    %w[Casey Dana Ellis].each do |name|
      within_participants_panel do
        within("tr", text: name) { click_button "Assign segment to #{name}" }
        find("option", text: "Pool").select_option
        within("tr", text: name) { expect(page).to have_text(/pool/i) }
      end
    end

    # ── Create the Guess Who block — auto-creates a Contestants segment ────────
    queue_block(n: 2) do
      select "Guess Who", from: "Kind"
      select "Pool", from: "Audience pool segment"
    end

    # ── Assign contestants to the auto-created Contestants segment ─────────────
    %w[Alex Blake].each do |name|
      within_participants_panel do
        within("tr", text: name) { click_button "Assign segment to #{name}" }
        find("option", text: "Guess Who Contestants — Block 2").select_option
        within("tr", text: name) { expect(page).to have_text(/contestants/i) }
      end
    end

    # ── Present Guess Who block ────────────────────────────────────────────────
    select_and_present(2, kind: "guess_who")

    # Monitor shows pre-start state
    using_session(:monitor) do
      visit "/experiences/guess-night/monitor"
      expect(page).to have_text("Waiting for the game to start")
    end

    # Participants see placeholder before any poll is active
    using_session(:alex) do
      visit current_path
      expect(page).to have_text("Watch the monitor")
    end

    # ── Select GuessWho block — manager is inline ─────────────────────────────
    guess_who_block = ExperienceBlock.find_by!(kind: :guess_who)
    select_block(2, kind: "guess_who")
    expect(page).to have_text(/contestants segment/i)

    # ── Start game ─────────────────────────────────────────────────────────────
    expect(page).to have_button("Start game", disabled: false)
    click_button "Start game"
    expect(page).to have_text(/contestant 1/i)
    expect(page).to have_text(/contestant 2/i)

    # Capture mystery assignments for deterministic elimination testing
    guess_who_block.reload
    mystery_1_uid = guess_who_block.payload.dig("contestants", 0, "mystery_user_id").to_s
    session_map = {
      User.find_by!(name: "Casey").id.to_s => :casey,
      User.find_by!(name: "Dana").id.to_s  => :dana,
      User.find_by!(name: "Ellis").id.to_s => :ellis,
    }
    mystery_1_session     = session_map[mystery_1_uid]
    non_mystery_1_sessions = session_map.reject { |uid, _| uid == mystery_1_uid }.values

    # ── Monitor idle: both contestant headers visible ──────────────────────────
    using_session(:monitor) do
      expect(page).to have_text("Guess Who?")
      expect(page).to have_text(/Alex|Blake/)
    end

    # ── Clue view: monitor shows mystery's answer to the question ─────────────
    within("[aria-label='Monitor view']") do
      click_button "C1 Clue"
    end

    using_session(:monitor) do
      expect(page).to have_text("What is your go-to karaoke song?")
    end

    # Hide the clue — monitor should show the empty state
    within("[aria-label='Contestant 1']") do
      click_button "Hide"
    end

    using_session(:monitor) do
      expect(page).to have_text("No clues available")
    end

    # Restore the clue
    within("[aria-label='Contestant 1']") do
      click_button "Show"
    end

    using_session(:monitor) do
      expect(page).to have_text("What is your go-to karaoke song?")
    end

    # ── Board view: monitor shows the grid of pool candidates ─────────────────
    within("[aria-label='Monitor view']") do
      click_button "C1 Board"
    end

    using_session(:monitor) do
      # Board displays pool members (mystery excluded from board_candidate_ids)
      expect(page).to have_text(/Casey|Dana|Ellis/)
    end

    # ── Dispatch T/F poll for contestant 1 ────────────────────────────────────
    within("[aria-label='Contestant 1']") do
      click_button "Dispatch T/F poll"
      expect(page).to have_button("Conclude poll")
    end

    using_session(:alex) do
      expect(page).to have_text("Watch the monitor")
    end

    using_session(:casey) do
      expect(page).to have_text("True or False?")
    end

    # Mystery submits True; one non-mystery submits True (survives); other submits False (eliminated)
    using_session(mystery_1_session) do
      expect(page).to have_button("True")
      click_button "True"
      expect(page).to have_text("You answered:")
    end

    using_session(non_mystery_1_sessions[0]) do
      expect(page).to have_button("True")
      click_button "True"
      expect(page).to have_text("You answered:")
    end

    using_session(non_mystery_1_sessions[1]) do
      expect(page).to have_button("False")
      click_button "False"
      expect(page).to have_text("You answered:")
    end

    # ── Conclude poll: one non-mystery eliminated ──────────────────────────────
    within("[aria-label='Contestant 1']") do
      expect(page).to have_text("Poll responses: 3")
      expect(page).to have_button("Conclude poll", disabled: false)
      click_button "Conclude poll"
      expect(page).to have_button("Dispatch T/F poll")
    end

    within("[aria-label='Contestant 1']") do
      expect(page).to have_text("Eliminated: 1")
    end

    # Poll cleared from participants
    using_session(:casey) do
      expect(page).to have_text("Watch the monitor")
    end

    # ── Reroll mystery for contestant 1 ───────────────────────────────────────
    within("[aria-label='Contestant 1']") do
      click_button "Reroll mystery"
      expect(page).to have_button("Reroll mystery", disabled: false)
    end

    # ── Contestant 2: board, poll, and conclude ────────────────────────────────
    within("[aria-label='Monitor view']") do
      click_button "C2 Board"
    end

    using_session(:monitor) do
      expect(page).to have_text(/Casey|Dana|Ellis/)
    end

    within("[aria-label='Contestant 2']") do
      click_button "Dispatch T/F poll"
      expect(page).to have_button("Conclude poll")
    end

    # All pool members submit True for contestant 2 — no eliminations
    %w[Casey Dana Ellis].each do |name|
      using_session(name.downcase.to_sym) do
        expect(page).to have_button("True")
        click_button "True"
        expect(page).to have_text("You answered:")
      end
    end

    within("[aria-label='Contestant 2']") do
      expect(page).to have_button("Conclude poll", disabled: false)
      click_button "Conclude poll"
      expect(page).to have_button("Dispatch T/F poll")
    end

    # ── Reveal ─────────────────────────────────────────────────────────────────
    click_button "Reveal"

    using_session(:monitor) do
      expect(page).to have_text("The Reveal")
      expect(page).to have_text("The mystery participant was")
    end
  end
end
