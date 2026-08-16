module AnalyticsHelper
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
