module SystemHelpers
  # This check is a work around to account for a full page animation that occurs
  # on page reloads. Not all links and buttons cause a full reload, so this is
  # adding overhead to every call, but as it is a negative assertion, it is
  # minimal when there is no animation and won't block the spec.
  def wait_for_animation
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

  # If the menu needs expanding and animation will occur. This method accounts
  # for the various menu states and animations
  def click_menu_link(link)
    expect(page).to have_button("Menu")

    # Check if the menu is expanded. If not, click Menu to expand
    unless page.has_css?("[aria-expanded='true']", wait: 0)
      click_button "Menu"
      expect(page).to have_css("[aria-expanded='true']")
    end

    # Precondition check to assert the link actually exists in the menu
    expect(page).to have_link(link)

    # The menu opens with an animation, this check forces the driver to move to
    # the center of the element and for it to be interactable. Without this the
    # click may work, but not actually hit the correct dom element as it is
    # moving on the page. This is needed for the state where the menu starts
    # closed, and doesn't impact the case where it is already open
    find_link(link).hover

    click_link(link)
  end

  def sign_in(user)
    visit "/"

    expect(page).to have_text("CCTV")

    click_menu_link("Sign in")

    expect(page).to have_field("email", disabled: false)
    fill_in "email", with: user.email
    click_button "Sign in"

    # The sign-in page doesn't render a menu so we can use it as a post
    # condition.
    expect(page).to have_button("Menu")
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

    expect(page).to have_text(experience_name)
  end
end
