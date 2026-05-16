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

      it "falls back to defaults for an unknown experience" do
        request.path = "/experiences/does-not-exist"
        get :index
        expect(response).to be_successful
        expect(og(:title)).to eq("chicagocomedy.tv")
      end
    end
  end
end
