require "rails_helper"

RSpec.describe ApplicationCable::Connection, type: :channel do
  before do
    create(:tenant, key: "other")
    allow(Tenants::Registry).to receive(:keys).and_return(%w[cctv other])
  end

  it "connects on the base domain as the default tenant" do
    connect "/cable", env: { "HTTP_HOST" => "localhost" }

    expect(connection.tenant).to eq(Tenant.default)
  end

  it "connects on a registered subdomain as that tenant" do
    connect "/cable", env: { "HTTP_HOST" => "other.localhost" }

    expect(connection.tenant.key).to eq("other")
  end

  it "rejects an unregistered subdomain" do
    expect { connect "/cable", env: { "HTTP_HOST" => "nope.localhost" } }.to have_rejected_connection
  end

  it "runs every command inside the connection's tenant" do
    original = ActsAsTenant.test_tenant
    connect "/cable", env: { "HTTP_HOST" => "other.localhost" }
    seen = []
    allow(connection.subscriptions).to receive(:execute_command) { seen << ActsAsTenant.current_tenant }

    ActsAsTenant.test_tenant = nil
    %w[subscribe message unsubscribe].each do |command|
      connection.handle_channel_command("command" => command)
    end

    expect(seen).to eq([connection.tenant] * 3)
  ensure
    ActsAsTenant.test_tenant = original
  end
end
