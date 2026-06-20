require "rails_helper"

RSpec.describe AnalyticsHelper, type: :helper do
  describe "#analytics_config_tag" do
    context "when analytics is disabled (the default in test)" do
      it "renders nothing" do
        allow(Analytics::Config).to receive(:enabled?).and_return(false)

        expect(helper.analytics_config_tag).to be_nil
      end
    end

    context "when analytics is enabled" do
      before do
        allow(Analytics::Config).to receive(:enabled?).and_return(true)
        allow(Analytics::Config).to receive(:client_config).and_return(
          enabled: true,
          key: "phc_test",
          host: "https://us.i.posthog.com",
          environment: "production",
          sessionReplay: false,
        )
      end

      it "renders a non-executable JSON config data block with the resolved config" do
        html = helper.analytics_config_tag.to_s

        expect(html).to include('id="analytics-config"')
        expect(html).to include('type="application/json"')
        expect(html).to include('"key":"phc_test"')
        expect(html).to include('"host":"https://us.i.posthog.com"')
        expect(html).to include('"enabled":true')
      end
    end
  end
end
