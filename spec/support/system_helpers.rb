module SystemHelpers
  # Guards against a full-page boot animation triggered on hard reloads. Not all
  # interactions cause a reload, so this runs after every click_button, click_link,
  # and visit. The sleep guards against the assertion firing before the animation
  # class is even applied; the have_no_css assertion waits for it to clear.
  def wait_for_animation
    sleep 0.5

    expect(page).to have_no_css(".app--booting")
  end

  # click_button, click_link, and visit are overridden to call wait_for_animation
  # after each invocation. This ensures every navigation or action that could
  # trigger the boot animation is automatically guarded before proceeding.
  def click_button(*args, &block)
    super(*args, &block)
    wait_for_animation
  end

  def click_link(*args, &block)
    super(*args, &block)
    wait_for_animation
  end

  def visit(*args, &block)
    super(*args, &block)
    wait_for_animation
  end

  def click_menu_link(link)
    expect(page).to have_link(link)
    click_link(link)
  end

  # Signs in a user via the admin session auth flow.
  # Leaves the page on the admin dashboard with "Logout" button visible.
  def sign_in(user)
    visit "/"

    expect(page).to have_text("CCTV")

    click_menu_link("Sign in")

    expect(page).to have_field("email", disabled: false)
    fill_in "email", with: user.email
    click_button "Sign in"

    expect(page).to have_button("Logout")
  end

  # Creates an experience via the admin UI.
  # Leaves the page on the experience show page with the QR code visible.
  def create_experience(name:, code:)
    click_menu_link("Create")

    expect(page).to have_text("Create Experience")
    fill_in "Name", with: name
    fill_in "Code", with: code
    click_button "Create"

    expect(page).to have_css("img[alt='QR code for joining an experience']")
  end

  # Creates an experience and navigates to the manage page.
  # Leaves the page on /manage with "No blocks yet" visible.
  def create_experience_and_go_to_manage(name:, code:)
    create_experience(name:, code:)

    expect(page).to have_css("img[alt='QR code for joining an experience'][data-loaded='true']")
    click_link "Go to lobby"

    expect(page).to have_text(
      "You're viewing this experience as an admin but aren't registered as a " \
        "participant."
    )

    click_link "Manage Experience"
    expect(page).to have_text("No blocks yet")
  end

  # Registers a participant via the /join flow.
  # Leaves the page on the experience page with experience_name visible.
  # Depending on experience state, the next page may be the avatar page
  # (lobby not started) or the experience waiting screen (experience live).
  def register_participant(code:, name:, email:, experience_name:)
    visit "/join?code=#{code}"

    expect(page).to have_text("Enter the secret code")

    click_button "Submit"

    expect(page).to have_button("Register", disabled: :all)
    fill_in placeholder: "Your Email", with: email
    fill_in placeholder: "Your Name", with: name
    click_button "Register"

    expect(page).to have_text(experience_name)
  end

  # Draws a stroke on the avatar canvas using low-level mouse events.
  # Requires the canvas to be present on the page.
  def draw_on_canvas
    expect(page).to have_css("canvas", wait: 10)

    rect = page.evaluate_script(
      "(() => { const r = document.querySelector('canvas').getBoundingClientRect(); " \
        "return { x: r.x, y: r.y, width: r.width, height: r.height }; })()"
    )
    cx = (rect["x"] + rect["width"] / 2).to_i
    cy = (rect["y"] + rect["height"] / 2).to_i
    page.driver.browser.mouse.move(x: cx, y: cy)
    page.driver.browser.mouse.down
    page.driver.browser.mouse.move(x: cx + 50, y: cy + 50)
    page.driver.browser.mouse.up
  end

  # Draws a stroke and submits the avatar via the lobby gate flow.
  # Asserts the lobby waiting screen is visible after submission.
  def draw_and_submit_avatar
    expect(page).to have_current_path(/avatar/, wait: 10)
    draw_on_canvas
    expect(page).to have_button("Submit", disabled: false)
    click_button "Submit"
    expect(page).to have_text("Players in Lobby:", wait: 10)
  end

  # Starts the experience. Asserts the Pause button is visible after starting.
  def start_experience
    click_button "Start"
    expect(page).to have_button("Pause")
  end

  # Opens the "Create Block" form, yields for block-specific field filling,
  # clicks "Queue block", and asserts block N appears in the sidebar.
  def queue_block(n:, &block)
    click_button "Block"
    expect(page).to have_text("Create Block")
    yield
    click_button "Queue block"
    expect(page).to have_css("li[aria-label='block #{n}']")
  end

  # Selects block N in the sidebar by clicking its kind button.
  # kind is matched case-insensitively as a regex pattern against the button text.
  def select_block(n, kind:)
    within("li[aria-label='block #{n}']") do
      find("button", text: /#{kind}/i).click
    end
  end

  # Presents the currently selected block.
  # Pre-asserts "Present" is available; post-asserts "Stop Presenting" appears.
  def present_block
    expect(page).to have_button("Present")
    click_button "Present"
    expect(page).to have_button("Stop Presenting")
  end

  # Stops presenting the currently selected block.
  # Pre-asserts "Stop Presenting" is available; post-asserts "Present" appears.
  def stop_presenting_block
    expect(page).to have_button("Stop Presenting")
    click_button "Stop Presenting"
    expect(page).to have_button("Present")
  end

  # Opens the participants panel, yields, then closes it.
  # Requires the manage page (/manage) to be the current path.
  def within_participants_panel(&block)
    expect(page).to have_current_path(/\/manage$/)
    click_button "Participants"
    expect(page).to have_button("Close participants panel")
    yield
    click_button "Close participants panel"
    expect(page).to have_button("Participants", exact: true)
    page.evaluate_script("document.activeElement.blur()")
  end
end
