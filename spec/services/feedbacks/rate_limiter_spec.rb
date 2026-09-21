require "rails_helper"

RSpec.describe Feedbacks::RateLimiter do
  let(:redis) { instance_double(Redis) }

  before do
    allow(Sidekiq).to receive(:redis).and_yield(redis)
    allow(redis).to receive(:expire)
  end

  it "allows submissions up to the limit for the source" do
    allow(redis).to receive(:incr).and_return(described_class::LIMITS[Feedback::MANUAL])

    expect(described_class.allow?(source: Feedback::MANUAL, identifier: "user-1")).to be(true)
  end

  it "refuses once the limit is exceeded" do
    allow(redis).to receive(:incr).and_return(described_class::LIMITS[Feedback::MANUAL] + 1)

    expect(described_class.allow?(source: Feedback::MANUAL, identifier: "user-1")).to be(false)
  end

  it "gives error reports a higher ceiling than manual feedback" do
    expect(described_class::LIMITS[Feedback::ERROR])
      .to be > described_class::LIMITS[Feedback::MANUAL]
  end

  it "sets the window expiry only on the first hit" do
    allow(redis).to receive(:incr).and_return(1)

    described_class.allow?(source: Feedback::MANUAL, identifier: "user-1")

    expect(redis).to have_received(:expire).with("feedback:rate:manual:user-1", 3600)
  end

  it "keys separately per reporter" do
    allow(redis).to receive(:incr).and_return(1)

    described_class.allow?(source: Feedback::MANUAL, identifier: "user-2")

    expect(redis).to have_received(:expire).with("feedback:rate:manual:user-2", anything)
  end

  it "fails open when Redis is unreachable, so an outage cannot block a bug report" do
    allow(redis).to receive(:incr).and_raise(RedisClient::CannotConnectError.new("down"))

    expect(described_class.allow?(source: Feedback::MANUAL, identifier: "user-1")).to be(true)
  end
end
