module SystemHelpers
  def sign_in(user)
    visit "/"
    expect(page).to have_text("CCTV")

    click_button "Menu"
    click_link "Sign in"

    fill_in "email", with: user.email
    click_button "Sign in"

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
end
