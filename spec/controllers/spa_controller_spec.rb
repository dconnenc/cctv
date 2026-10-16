require "rails_helper"

RSpec.describe SpaController, type: :controller do
  def og(name)
    controller.instance_variable_get(:"@og_#{name}")
  end

  describe "GET #index" do
    context "default site" do
      it "sets site-level OG metadata" do
        get :index
        expect(response).to be_successful
        expect(og(:site_name)).to eq("chicagocomedy.tv")
        expect(og(:title)).to eq("chicagocomedy.tv")
        expect(og(:description)).to be_present
        expect(og(:image)).to end_with("/icon.png")
        expect(og(:type)).to eq("website")
      end

      it "keeps the CCTV default description" do
        get :index
        expect(og(:description)).to eq("Interactive comedy experiences for live audiences.")
      end

      {
        "/events" => ["Events", "Upcoming live comedy events on chicagocomedy.tv."],
        "/performers" => ["Performers", "Comedians and performers on chicagocomedy.tv."],
        "/about" => ["About", "Interactive comedy experiences for live audiences."],
        "/join" => ["Join a show", "Enter a code to join a live experience on chicagocomedy.tv."],
      }.each do |path, (title, description)|
        it "keeps the CCTV metadata for #{path}" do
          request.path = path
          get :index
          expect(og(:site_name)).to eq("chicagocomedy.tv")
          expect(og(:title)).to eq(title)
          expect(og(:description)).to eq(description)
        end
      end

      it "keeps the CCTV performer fallback description" do
        performer = Performer.create!(name: "Pat Comic", user: create(:user))
        request.path = "/performers/#{performer.slug}"
        get :index
        expect(og(:title)).to eq("Pat Comic")
        expect(og(:description)).to eq("Pat Comic on chicagocomedy.tv.")
      end
    end

    context "experience lobby" do
      let(:experience) do
        create(:experience, name: "Improv Night", description: "Live unscripted comedy")
      end

      it "uses the experience name and description" do
        request.path = "/experiences/#{experience.code_slug}"
        get :index
        expect(og(:title)).to eq("Improv Night")
        expect(og(:description)).to eq("Live unscripted comedy")
      end

      it "frames the register URL as a join CTA" do
        request.path = "/experiences/#{experience.code_slug}/register"
        get :index
        expect(og(:title)).to eq('Join "Improv Night"')
      end

      it "keeps the CCTV fallback description for an experience without one" do
        experience.update!(description: nil)
        request.path = "/experiences/#{experience.code_slug}"
        get :index
        expect(og(:description)).to eq('Join "Improv Night" — a live interactive experience on chicagocomedy.tv.')
      end

      it "falls back to defaults for an unknown experience" do
        request.path = "/experiences/does-not-exist"
        get :index
        expect(response).to be_successful
        expect(og(:title)).to eq("chicagocomedy.tv")
      end
    end

    context "social-quiztancing tenant" do
      before { request.host = "social-quiztancing.localhost" }

      it "uses the tenant's site name and description for Open Graph tags" do
        get :index

        expect(og(:site_name)).to eq("Social Quiztancing")
        expect(og(:title)).to eq("Social Quiztancing")
        expect(og(:description)).to eq(Tenant.find_by!(key: "social-quiztancing").config.theme.description)
      end

      it "uses the tenant's site name in route descriptions" do
        request.path = "/join"
        get :index

        expect(og(:description)).to eq("Enter a code to join a live experience on Social Quiztancing.")
      end
    end
  end
end
