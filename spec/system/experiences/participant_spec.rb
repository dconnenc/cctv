require "rails_helper"

RSpec.describe "Participating in an Experience", type: :system do
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

  describe "Joining a second experience" do
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

    it "pre-populates data from previous experiences" do
      using_session(:participant) do
        register_participant(
          code: experience.code_slug,
          name: "Alice",
          email: "alice@example.com",
          experience_name: experience.name
        )

        draw_and_submit_avatar

        # Visit the join page for a new experience, while still having an
        # active session
        visit "/join?code=#{experience2.code_slug}"
        expect(page).to have_text("Enter the secret code")
        click_button "Submit"

        # Assert the most recent user name was used
        expect(page).to have_field(placeholder: "Your Name", with: "Alice")

        # No email field as the user has an active session
        expect(page).to_not have_field(placeholder: "Your Email")

        click_button "Register"

        visit "/experiences/#{experience2.code_slug}/avatar"

        # Canvas is pre-populated with the previous avatar, so Submit is enabled
        expect(page).to have_button("Back")
      end
    end
  end
end
