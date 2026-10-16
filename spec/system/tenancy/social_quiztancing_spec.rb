require "rails_helper"

RSpec.describe "social-quiztancing tenant", type: :system do
  let(:quiz) { Tenant.find_by!(key: "social-quiztancing") }

  around do |example|
    original_app_host = Capybara.app_host
    original_always_include_port = Capybara.always_include_port
    Capybara.always_include_port = true
    use_host("social-quiztancing.localhost")
    example.run
  ensure
    Capybara.app_host = original_app_host
    Capybara.always_include_port = original_always_include_port
  end

  def use_host(host)
    Capybara.app_host = "http://#{host}"
  end

  def sign_in_on_tenant(user)
    visit "/"
    click_menu_link("Sign in")

    expect(page).to have_field("email", disabled: false)
    fill_in "email", with: user.email
    click_button "Sign in"

    expect(page).to have_button("Logout")
  end

  def tenant_config
    JSON.parse(find("script#tenant-config", visible: :all).text(:all))
  end

  it "resolves the tenant from the host and hides public features" do
    visit "/"

    expect(tenant_config).to include("key" => "social-quiztancing", "features" => [])

    click_button "Shows"

    expect(page).to have_link("Join Show")
    expect(page).to have_no_link("Browse Events")
    expect(page).to have_no_link("Browse Performers")
  end

  it "keeps experiences created on the tenant out of cctv" do
    quiz_admin = ActsAsTenant.with_tenant(quiz) { create(:user, :admin) }
    sign_in_on_tenant(quiz_admin)
    create_experience(name: "Quiz Night", code: "QUIZ-1")

    visit "/experiences"
    expect(page).to have_text("quiz-1")

    use_host("localhost")
    sign_in(create(:user, :admin))
    create_experience(name: "Comedy Night", code: "COMEDY-1")

    visit "/experiences"
    expect(page).to have_text("comedy-1")
    expect(page).to have_no_text("quiz-1")
  end

  it "only offers the tenant's allowed block kinds" do
    quiz_admin = ActsAsTenant.with_tenant(quiz) { create(:user, :admin) }
    sign_in_on_tenant(quiz_admin)
    create_experience_and_go_to_manage(name: "Quiz Night", code: "QUIZ-2")

    queue_block(n: 1) do
      expect(page).to have_select(
        "Kind",
        options: [
          "Poll",
          "Question",
          "Announcement",
          "Family Feud",
          "Photo Upload",
          "Buzzer",
          "Feedback"
        ]
      )
      select "Family Feud", from: "Kind"
      fill_in "Title", with: "Quiz Feud"
      click_button "Add Question"
      expect(page).to have_field("Question 1")
      fill_in "Question 1", with: "Name a quiz category"
    end

    expect(page).to have_css("li[aria-label='block 1']", text: /family.feud/i)
  end
end
