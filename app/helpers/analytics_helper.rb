module AnalyticsHelper
  # Embeds the browser analytics config as a non-executable JSON data block.
  # The frontend reads it on boot to decide whether to initialize PostHog.
  # Renders nothing when analytics is disabled, so the SDK never starts in
  # development, test, or any environment without POSTHOG_KEY set.
  def analytics_config_tag
    return unless Analytics::Config.enabled?

    content_tag(
      :script,
      raw(ERB::Util.json_escape(Analytics::Config.client_config.to_json)),
      type: "application/json",
      id: "analytics-config",
    )
  end
end
