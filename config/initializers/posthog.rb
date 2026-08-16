require "posthog"
require "posthog/rails"

posthog_api_key = ENV["POSTHOG_API_KEY"].presence

if posthog_api_key.present?
  PostHog.init do |config|
    config.api_key = posthog_api_key
    config.host = ENV["POSTHOG_HOST"].presence
  end

  PostHog::Rails.configure do |config|
    config.auto_capture_exceptions = true
    config.report_rescued_exceptions = true
    config.auto_instrument_active_job = true
    config.capture_user_context = true
    config.current_user_method = :current_user
    config.user_id_method = :posthog_distinct_id
  end
elsif Rails.env.development?
  raise "POSTHOG_API_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once POSTHOG_API_KEY is configured"
end
