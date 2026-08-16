require "rails_helper"

RSpec.describe "Segment visibility", type: :system do
  let(:admin) { create(:user, :admin) }

  it "participant gains and loses visibility of a segment-scoped block when manually assigned and removed" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Test Experience", code: "test-exp")

    within_participants_panel do
      click_button "Add"
      fill_in placeholder: "Segment name", with: "Red"
      click_button "Add"
      expect(page).to have_text(/Red/i)
    end

    queue_block(n: 1) do
      select "Announcement", from: "Kind"
      fill_in "Announcement Message", with: "Hello Red!"
      find("select[aria-label='Add segment']").select("Red")
    end

    start_experience
    select_and_present(1, kind: "announcement")

    using_session(:participant) do
      register_participant(
        code: "test-exp",
        name: "Alice",
        email: "alice@example.com",
        experience_name: "Test Experience"
      )
      expect(page).to have_text("Waiting for the next activity...")
    end

    # Admin assigns Alice to Red — she should now see the scoped block
    visit current_path
    within_participants_panel do
      within("tr", text: "Alice") do
        click_button "Assign segment to Alice"
        select "Red"
      end
      expect(page).to have_text(/Red/i)
    end

    using_session(:participant) do
      expect(page).to have_text("Hello Red!")
    end

    # Admin removes Alice from Red — she should lose visibility
    visit current_path
    within_participants_panel do
      within("tr", text: "Alice") do
        click_button "Remove Red"
      end
    end

    using_session(:participant) do
      expect(page).to have_text("Waiting for the next activity...")
    end
  end
end
