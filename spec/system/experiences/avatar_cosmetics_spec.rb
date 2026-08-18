require "rails_helper"

RSpec.describe "Avatar cosmetics", type: :system do
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
  let!(:hat) { create(:cosmetic, name: "Top Hat", slug: "top-hat", default_grant: true) }

  def register_alice
    register_participant(
      code: experience.code_slug,
      name: "Alice",
      email: "alice@example.com",
      experience_name: experience.name,
      draw_avatar: false
    )
    expect(page).to have_current_path("/experiences/#{experience.code_slug}/avatar")
  end

  it "applies an owned cosmetic and shows the flattened avatar with a separate cosmetic layer" do
    using_session(:participant) do
      register_alice
      draw_on_canvas

      # Inventory is only available in Decorate mode; it defaults to closed.
      click_button "Decorate"
      expect(page).to have_text(/inventory/i)
      select "Clothing", from: "Inventory"
      expect(page).to have_button("Apply Top Hat")
      click_button "Apply Top Hat"

      expect(page).to have_button("Submit", disabled: false)
      click_button "Submit"
      expect(page).to have_current_path("/experiences/#{experience.code_slug}")

      # The finalized avatar renders a flattened raster plus the hat overlay.
      within('button[aria-label="Edit avatar"]') do
        expect(page).to have_css("img[src^='data:image/png']")
        expect(page).to have_css("img", minimum: 2)
      end
    end
  end

  it "only shows cosmetics the participant owns" do
    create(:cosmetic, name: "Secret Crown", slug: "secret-crown", default_grant: false)

    using_session(:participant) do
      register_alice
      draw_on_canvas

      click_button "Decorate"
      select "Clothing", from: "Inventory"

      expect(page).to have_button("Apply Top Hat")
      expect(page).to have_no_button("Apply Secret Crown")
    end
  end

  it "switches inventory category via the dropdown" do
    using_session(:participant) do
      register_alice
      draw_on_canvas
      click_button "Decorate"

      select "Clothing", from: "Inventory"
      expect(page).to have_button("Apply Top Hat")

      select "Frames", from: "Inventory"

      # Switched away from clothing; Alice owns no frames.
      expect(page).to have_no_button("Apply Top Hat")
      expect(page).to have_text("None yet")
    end
  end

  it "lets a background color be chosen and baked into the flattened avatar" do
    using_session(:participant) do
      register_alice

      click_button "Background"
      click_button "Color"
      expect(page).to have_button("No background")

      first("button[aria-label^='Background ']").click

      expect(page).to have_button("Submit", disabled: false)
      click_button "Submit"
      expect(page).to have_current_path("/experiences/#{experience.code_slug}")

      within('button[aria-label="Edit avatar"]') do
        expect(page).to have_css("img[src^='data:image/png']")
      end
    end
  end

  it "hides the inventory while drawing and reveals it in decorate mode" do
    using_session(:participant) do
      register_alice

      click_button "Decorate"
      expect(page).to have_text(/inventory/i)

      click_button "Draw"
      expect(page).to have_no_text(/inventory/i)
    end
  end
end
