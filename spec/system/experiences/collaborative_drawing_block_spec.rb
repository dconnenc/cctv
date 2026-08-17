require "rails_helper"

RSpec.describe "Collaborative Drawing Block", type: :system do
  let(:admin) { create(:user, :admin) }

  # Attaches a photo to the collaborative drawing block on behalf of a
  # participant, bypassing the ActiveStorage direct-upload UI (which is not
  # driven in system tests). Seeds the intake pool before a round starts.
  def seed_photo(code:, participant_name:)
    experience = Experience.find_by!(code: code)
    block = experience.experience_blocks.find_by!(kind: ExperienceBlock::COLLABORATIVE_DRAWING)
    participant = experience.experience_participants.find_by!(name: participant_name)

    photo = ExperienceCollaborativeDrawingPhoto.new(
      experience_block: block,
      experience_participant: participant
    )
    photo.save!(validate: false)
    photo.photo.attach(
      io: StringIO.new("fake-image-bytes"),
      filename: "photo.png",
      content_type: "image/png"
    )
  end

  it "collects photos, dispatches a slice assignment, and reveals the composite" do
    sign_in(admin)
    create_experience_and_go_to_manage(name: "Draw Party", code: "draw-exp")

    queue_block(n: 1) do
      select "Collaborative Drawing", from: "Kind"
      fill_in "Photo prompt", with: "Submit a photo of your pet"
      fill_in "Total drawings", with: "1"
      fill_in "Minimum subsections", with: "2"
      fill_in "Maximum subsections", with: "4"
      fill_in "Drawing time", with: "30"
    end

    start_experience

    using_session(:participant) do
      register_participant(
        code: "draw-exp",
        name: "Alice",
        email: "alice@example.com",
        experience_name: "Draw Party"
      )
      expect(page).to have_text("Waiting for the next activity...")
    end

    visit current_path
    select_and_present(1, kind: "collaborative_drawing")

    # Host sees the intake config; the round cannot start without photos.
    expect(page).to have_text("Submit a photo of your pet")
    expect(page).to have_button("Start round", disabled: true)

    # Participant is prompted to contribute a photo, decoupled from any round.
    using_session(:participant) do
      expect(page).to have_text("Submit a photo of your pet")
      expect(page).to have_text("Tap to select a photo")
    end

    # Monitor advertises the intake and the running photo count.
    using_session(:monitor) do
      visit "/experiences/draw-exp/monitor"
      expect(page).to have_text("Submit a photo of your pet")
      expect(page).to have_text("0 photos received")
    end

    # Seed a photo into the pool, then reload the manage view so the count and
    # the enabled "Start round" control reflect it.
    seed_photo(code: "draw-exp", participant_name: "Alice")
    visit current_path
    select_block(1, kind: "collaborative_drawing")

    expect(page).to have_text("1 photo received")
    expect(page).to have_button("Start round", disabled: false)
    click_button "Start round"
    expect(page).to have_button("End round now")

    # The round start pushes Alice her slice assignment (via re-subscribe) and
    # she drops into the memorize-your-photo preview.
    using_session(:participant) do
      expect(page).to have_text(/Memorize this image!|Remember your section!/, wait: 10)
    end

    # The monitor counts the audience down to "draw".
    using_session(:monitor) do
      expect(page).to have_text(/Get ready to draw!|Drawing on phones/, wait: 10)
    end

    # End the round from the host: composites assemble and are shown back.
    click_button "End round now"

    using_session(:monitor) do
      expect(page).to have_text("The masterpieces", wait: 10)
    end

    using_session(:participant) do
      expect(page).to have_text("Your group's masterpiece", wait: 10)
    end
  end
end
