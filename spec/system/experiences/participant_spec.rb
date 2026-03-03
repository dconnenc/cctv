require "rails_helper"

RSpec.describe "Managing Blocks", type: :system do
  let(:admin) { create(:user, :admin) }
  let!(:experience) do
    create(
      :experience,
      :draft,
      creator: admin,
      name: "Management Experience",
      code: "management-experience"
    )
  end

  describe "enqueing and presenting blocks" do
    before do
      # Sign an admin in as the default session so we can get back to the
      # management screen to make changes to the experience state
      sign_in(admin)
    end

    it "prompts a user for an avatar while in the lobby" do
      using_session(:monitor) do
        visit "/experiences/#{experience.code_slug}/monitor"
        expect(page).to have_text("Participants")
      end

      using_session(:participant) do
        register_participant(
          code: experience.code_slug,
          name: "Alice",
          email: "alice@example.com",
          experience_name: experience.name
        )

        expect(page).to have_text("Draw your avatar to enter the lobby")

        # Draw an avatar and hit submit
        find("canvas")
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
        click_button "Submit"

        # assert in lobby
        expect(page).to have_text("Players in Lobby:")
        expect(page).to have_text("Waiting for the experience to start...")
      end

      using_session(:monitor) do
        expect(page).to have_text("Alice")
      end
    end
  end

  describe "most recent participant data" do
    let!(:experience2) do
      create(
        :experience,
        :draft,
        creator: admin,
        name: "Second Experience",
        code: "second-experience"
      )
    end

    before do
      sign_in(admin)
    end

    def draw_and_submit_avatar
      find("canvas")
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
      click_button "Submit"
      expect(page).to have_text("Players in Lobby:")
    end

    it "pre-populates name on the register form from previous participation" do
      using_session(:participant) do
        register_participant(
          code: experience.code_slug,
          name: "Alice",
          email: "alice@example.com",
          experience_name: experience.name
        )
        draw_and_submit_avatar

        visit "/join?code=#{experience2.code_slug}"
        expect(page).to have_text("Enter the secret code")
        click_button "Submit"

        expect(page).to have_field(placeholder: "Your Name", with: "Alice")
      end
    end

    it "pre-populates avatar from previous participation" do
      using_session(:participant) do
        register_participant(
          code: experience.code_slug,
          name: "Alice",
          email: "alice@example.com",
          experience_name: experience.name
        )
        draw_and_submit_avatar

        visit "/join?code=#{experience2.code_slug}"
        expect(page).to have_text("Enter the secret code")
        click_button "Submit"

        fill_in placeholder: "Your Name", with: "Alice"
        click_button "Register"
        wait_for_animation

        # Goes straight to lobby because avatar was pre-populated from previous participation
        expect(page).to have_text("Players in Lobby:")

        # Edit avatar page shows the pre-populated canvas (Submit is enabled)
        find("button", text: "Edit Avatar").click
        expect(page).to have_button("Submit", disabled: false)
      end
    end
  end
end
