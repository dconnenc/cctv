require "rails_helper"

RSpec.describe Tenants::FeatureConstraint do
  def request_for(host)
    instance_double(ActionDispatch::Request, host: host)
  end

  it "matches a tenant that has the feature" do
    expect(described_class.new(:events).matches?(request_for("localhost"))).to be(true)
  end

  it "does not match a tenant without the feature" do
    expect(described_class.new(:events).matches?(request_for("social-quiztancing.localhost"))).to be(false)
  end

  it "does not match an unregistered subdomain" do
    expect(described_class.new(:events).matches?(request_for("nope.localhost"))).to be(false)
  end
end
