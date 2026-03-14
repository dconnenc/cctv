module SystemHelpers
  # This check is a work around to account for a full page animation that occurs
  # on page reloads. Not all links and buttons cause a full reload, so this is
  # adding overhead to every call, but as it is a negative assertion, it is
  # minimal when there is no animation and won't block the spec.
  def wait_for_animation
    sleep 0.1

    expect(page).to have_no_css(".app--booting")
  end

  # Base method overrides START
  # See above for why we're overriding methods
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
  # Base method overrides END

  def click_menu_link(link)
    expect(page).to have_link(link)
    click_link(link)
  end

  def sign_in(user)
    visit "/"

    expect(page).to have_text("CCTV")

    click_menu_link("Sign in")

    expect(page).to have_field("email", disabled: false)
    fill_in "email", with: user.email
    click_button "Sign in"

    expect(page).to have_button("Logout")
  end

  def create_experience(name:, code:)
    click_menu_link("Create")

    expect(page).to have_text("Create Experience")
    fill_in "Name", with: name
    fill_in "Code", with: code
    click_button "Create"

    # Assert a QR code is rendered. This is a positive assertion to check the
    # create action worked
    expect(page).to have_css("img[alt='QR code for joining an experience']")
  end

  def create_experience_and_go_to_manage(name:, code:)
    create_experience(name:, code:)

    click_link "Go to lobby"

    expect(page).to have_text(
      "You're viewing this experience as an admin but aren't registered as a " \
        "participant."
    )

    click_link "Manage Experience"
    expect(page).to have_text("No blocks yet")
  end

  def register_participant(code:, name:, email:, experience_name:)
    visit "/join?code=#{code}"

    # Assert the form is rendered. This is a positive assertion to check the
    # navigate went to a valid code
    expect(page).to have_text("Enter the secret code")

    click_button "Submit"

    expect(page).to have_button("Register", disabled: :all)
    fill_in placeholder: "Your Email", with: email
    fill_in placeholder: "Your Name", with: name
    click_button "Register"

    # TODO: Use a real positive assertion that registration worked here.
    # Attempts at negative checks are flaky
    sleep 1
    expect(page).to have_text(experience_name)
  end

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

  def draw_and_submit_avatar
    expect(page).to have_current_path(/avatar/, wait: 10)
    draw_on_canvas
    click_button "Submit"
    expect(page).to have_text("Players in Lobby:", wait: 10)
  end

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
