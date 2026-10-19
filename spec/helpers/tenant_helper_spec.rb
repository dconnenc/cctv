require "rails_helper"

RSpec.describe TenantHelper, type: :helper do
  def parse_config(html)
    JSON.parse(Nokogiri::HTML.fragment(html).at_css("script#tenant-config").text)
  end

  it "renders the current tenant's public config as JSON" do
    html = ActsAsTenant.with_tenant(Tenant.default) { helper.tenant_config_tag }
    json = parse_config(html)

    expect(json).to include("key" => "cctv", "name" => "CCTV")
    expect(json["features"]).to match_array(Tenants::Config::FEATURES)
    expect(json["blocks"]).to match_array(ExperienceBlock::KINDS)
    expect(json["theme"]).to eq(
      "displayName" => "CCTV",
      "tagline" => "CHICAGO COMEDY . TV",
      "ticketTagline" => "CHICAGO COMEDY TV",
    )
  end

  it "reflects a restricted tenant" do
    quiz = Tenant.find_by!(key: "social-quiztancing")
    html = ActsAsTenant.with_tenant(quiz) { helper.tenant_config_tag }
    json = parse_config(html)

    expect(json["features"]).to eq([])
    expect(json["blocks"]).not_to include("the_scene")
  end

  it "escapes markup that could break out of the script element" do
    tenant = Tenant.default
    allow(tenant).to receive(:config).and_return(tenant.config.new(name: "</script><!--<script>alert(1)</script>"))

    html = ActsAsTenant.with_tenant(tenant) { helper.tenant_config_tag }.to_s

    expect(html).not_to include("</script><!--")
    expect(html.scan("</script>").size).to eq(1)
    expect(parse_config(html)["name"]).to eq("</script><!--<script>alert(1)</script>")
  end

  it "neutralizes script terminators and comment openers in tenant strings" do
    payload = "</script><script>alert(1)</script> <!--"
    tenant = Tenant.default
    allow(tenant).to receive(:config).and_return(tenant.config.new(name: payload))

    html = ActsAsTenant.with_tenant(tenant) { helper.tenant_config_tag }.to_s

    expect(html).not_to include("</script><script>")
    expect(html).not_to include("<!--")
    expect(html.scan("</script>").size).to eq(1)
    expect(parse_config(html)["name"]).to eq(payload)
  end

  it "renders nothing without a current tenant" do
    expect(ActsAsTenant.without_tenant { helper.tenant_config_tag }).to be_nil
  end

  describe "#tenant_theme_style_tag" do
    it "emits nothing when the tenant has no css variables" do
      expect(ActsAsTenant.with_tenant(Tenant.default) { helper.tenant_theme_style_tag }).to be_nil
    end

    it "emits nothing without a current tenant" do
      expect(ActsAsTenant.without_tenant { helper.tenant_theme_style_tag }).to be_nil
    end

    it "emits a high-specificity :root override for tenant variables" do
      quiz = Tenant.find_by!(key: "social-quiztancing")
      html = ActsAsTenant.with_tenant(quiz) { helper.tenant_theme_style_tag }

      expect(html).to include("html:root")
      expect(html).to include("--phosphor: #5cc8ff;")
      expect(Nokogiri::HTML.fragment(html).css("style").size).to eq(1)
    end
  end
end
