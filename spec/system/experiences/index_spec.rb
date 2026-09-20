require "rails_helper"

RSpec.describe "Experiences index", type: :system do
  let(:admin) { create(:user, :admin) }

  before do
    sign_in(admin)
    create_experience(name: "First Show", code: "first-show")
    create_experience(name: "Second Show", code: "second-show")
  end

  it "lists all experiences ordered newest first with links to manage" do
    visit "/experiences"

    expect(page).to have_link("Manage", href: "/experiences/first-show/manage", wait: 10)
    expect(page).to have_link("Manage", href: "/experiences/second-show/manage")

    # Second Show was created more recently — its manage link should appear first
    second_pos = page.body.index("/experiences/second-show/manage")
    first_pos = page.body.index("/experiences/first-show/manage")
    expect(second_pos).to be < first_pos
  end
end
