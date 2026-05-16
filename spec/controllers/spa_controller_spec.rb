require "rails_helper"

RSpec.describe SpaController, type: :controller do
  render_views

  describe "GET #index" do
    context "default site" do
      it "renders site-level OG metadata" do
        get :index
        expect(response).to be_successful
        expect(response.body).to include('property="og:site_name"')
        expect(response.body).to include('content="chicagocomedy.tv"')
        expect(response.body).to include('property="og:title"')
        expect(response.body).to include('property="og:description"')
        expect(response.body).to include('property="og:image"')
      end
    end

    context "experience lobby" do
      let(:experience) do
        create(:experience, name: "Improv Night", description: "Live unscripted comedy")
      end

      it "uses the experience name and description" do
        request.path = "/experiences/#{experience.code_slug}"
        get :index
        expect(response.body).to include('property="og:title"')
        expect(response.body).to include("Improv Night")
        expect(response.body).to include("Live unscripted comedy")
      end

      it "frames the register URL as a join CTA" do
        request.path = "/experiences/#{experience.code_slug}/register"
        get :index
        expect(response.body).to include(%(content="Join &quot;Improv Night&quot;"))
      end

      it "falls back to defaults for an unknown experience" do
        request.path = "/experiences/does-not-exist"
        get :index
        expect(response.body).to include("chicagocomedy.tv")
        expect(response).to be_successful
      end
    end
  end
end
