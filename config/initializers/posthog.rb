require "posthog"

# Singleton PostHog client, reused for the life of the process (multiple
# clients can drop events). When POSTHOG_KEY is absent the client is created in
# a disabled state and every call becomes a no-op, so analytics is effectively
# off in development and test without any branching at the call sites.
POSTHOG = PostHog::Client.new(
  api_key: ENV["POSTHOG_KEY"].to_s,
  host: ENV.fetch("POSTHOG_HOST", "https://us.i.posthog.com"),
  test_mode: Rails.env.test?,
  silence_disabled_client_error: true,
  on_error: ->(status, message) { Rails.logger.warn("[PostHog] #{status} - #{message}") },
)

at_exit do
  POSTHOG.shutdown
rescue StandardError
  nil
end
