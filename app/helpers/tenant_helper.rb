module TenantHelper
  def tenant_config_tag
    config = ActsAsTenant.current_tenant&.config
    return if config.nil?

    payload = {
      key: config.key,
      name: config.name,
      features: config.features,
      blocks: config.blocks,
      theme: { displayName: config.theme.display_name },
    }

    content_tag(
      :script,
      raw(ERB::Util.json_escape(payload.to_json)),
      type: "application/json",
      id: "tenant-config",
    )
  end
end
