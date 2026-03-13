require "rails_helper"

RSpec.describe "Avatar flow", type: :system do
  let(:admin) { create(:user, :admin) }
  let!(:experience) do
    create(
      :experience,
      :draft,
      creator: admin,
      name: "Test Experience",
      code: "test-experience"
    )
  end

  describe "Lobby gate (experience not started)" do
    it "redirects an avatar-less participant to the avatar page with lobby gate UI" do
      using_session(:participant) do
        register_participant(
          code: experience.code_slug,
          name: "Alice",
          email: "alice@example.com",
          experience_name: experience.name
        )

        expect(page).to have_current_path("/experiences/#{experience.code_slug}/avatar")
        expect(page).to have_text("Draw your avatar to enter the lobby")
        expect(page).to have_button("Submit", disabled: true)
        expect(page).not_to have_button("Back")
      end
    end

    it "redirects back to avatar page when navigating directly to experience without an avatar" do
      using_session(:participant) do
        register_participant(
          code: experience.code_slug,
          name: "Alice",
          email: "alice@example.com",
          experience_name: experience.name
        )

        visit "/experiences/#{experience.code_slug}"

        expect(page).to have_current_path("/experiences/#{experience.code_slug}/avatar")
        expect(page).to have_text("Draw your avatar to enter the lobby")
      end
    end

    it "shows the avatar button after submitting and switches to free-edit mode when re-entering" do
      using_session(:participant) do
        register_participant(
          code: experience.code_slug,
          name: "Alice",
          email: "alice@example.com",
          experience_name: experience.name
        )

        draw_and_submit_avatar

        expect(page).to have_css('button[aria-label="Edit avatar"]')

        find('button[aria-label="Edit avatar"]').click
        wait_for_animation

        expect(page).to have_current_path("/experiences/#{experience.code_slug}/avatar")
        expect(page).not_to have_text("Draw your avatar to enter the lobby")
        expect(page).to have_button("Back")
        expect(page).not_to have_button("Submit")
      end
    end

    it "clears the avatar and shows placeholder in the button when clicking Back after clearing" do
      using_session(:participant) do
        register_participant(
          code: experience.code_slug,
          name: "Alice",
          email: "alice@example.com",
          experience_name: experience.name
        )

        draw_and_submit_avatar

        find('button[aria-label="Edit avatar"]').click
        wait_for_animation

        click_button "Clear"
        click_button "Back"

        expect(page).to have_current_path("/experiences/#{experience.code_slug}")

        # Re-open the editor — canvas should be empty so Submit is disabled
        find('button[aria-label="Edit avatar"]').click
        wait_for_animation

        expect(page).to have_button("Back")
        expect(page).to have_css("canvas")
        # Canvas is empty so there are no drawn strokes to submit back with
        expect(page).not_to have_button("Submit")
      end
    end

    it "saves the avatar and returns to experience when clicking Back after editing" do
      using_session(:participant) do
        register_participant(
          code: experience.code_slug,
          name: "Alice",
          email: "alice@example.com",
          experience_name: experience.name
        )

        draw_and_submit_avatar

        find('button[aria-label="Edit avatar"]').click
        wait_for_animation

        draw_on_canvas
        click_button "Back"

        expect(page).to have_current_path("/experiences/#{experience.code_slug}")
        expect(page).to have_css('button[aria-label="Edit avatar"]')
      end
    end
  end

  describe "Started experience" do
    before do
      sign_in(admin)
      visit "/experiences/#{experience.code_slug}/manage"
      click_button "Start"
      expect(page).to have_button("Pause")
    end

    it "does not gate a participant without an avatar when the experience is live" do
      using_session(:participant) do
        register_participant(
          code: experience.code_slug,
          name: "Bob",
          email: "bob@example.com",
          experience_name: experience.name
        )

        expect(page).not_to have_current_path("/experiences/#{experience.code_slug}/avatar")
        expect(page).to have_css('button[aria-label="Edit avatar"]')
      end
    end

    it "allows a participant to navigate to avatar editor and back without a lobby gate" do
      using_session(:participant) do
        register_participant(
          code: experience.code_slug,
          name: "Bob",
          email: "bob@example.com",
          experience_name: experience.name
        )

        find('button[aria-label="Edit avatar"]').click
        wait_for_animation

        expect(page).to have_current_path("/experiences/#{experience.code_slug}/avatar")
        expect(page).not_to have_text("Draw your avatar to enter the lobby")
        expect(page).to have_button("Back")
        expect(page).not_to have_button("Submit")

        click_button "Back"

        expect(page).not_to have_current_path("/experiences/#{experience.code_slug}/avatar")
      end
    end
  end
end
