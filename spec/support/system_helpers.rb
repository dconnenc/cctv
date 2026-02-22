module SystemHelpers
  def wait_for_boot
    expect(page).to have_no_css(".app--booting")
  end

  def sign_in(user)
    visit "/"
    wait_for_boot
    expect(page).to have_text("CCTV")

    click_button "Menu"
    click_link "Sign in"

    fill_in "email", with: user.email
    click_button "Sign in"

    wait_for_boot
    expect(page).to have_button("Menu")
  end

  def create_experience(name:, code:)
    click_button "Menu"
    click_link "Create"

    expect(page).to have_text("Create Experience")
    fill_in "Name", with: name
    fill_in "Code", with: code
    click_button "Create"

    expect(page).to have_css("img[alt='QR code for joining an experience']")
  end

  def create_experience_and_go_to_manage(name:, code:)
    create_experience(name:, code:)

    click_link "Go to lobby"
    wait_for_boot

    expect(page).to have_text(
      "You're viewing this experience as an admin but aren't registered as a " \
        "participant."
    )

    click_link "Manage Experience"
    expect(page).to have_text("No blocks yet")
  end

  def register_participant(code:, name:, email:, experience_name:)
    visit "/join?code=#{code}"
    wait_for_boot
    expect(page).to have_text("Enter the secret code")

    click_button "Submit"

    wait_for_boot
    expect(page).to have_button("Register", disabled: :all)
    fill_in placeholder: "Your Email", with: email
    fill_in placeholder: "Your Name", with: name
    click_button "Register"

    wait_for_boot
    expect(page).to have_text(experience_name)
  end
end
