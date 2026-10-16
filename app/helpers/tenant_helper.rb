module TenantHelper
  def tenant_config_tag
    config = ActsAsTenant.current_tenant&.config
    return if config.nil?

    payload = {
      key: config.key,
      name: config.name,
      features: config.features,
      blocks: config.blocks,
      theme: { displayName: config.theme.display_name, tagline: config.theme.tagline },
    }

    content_tag(
      :script,
      raw(ERB::Util.json_escape(payload.to_json)),
      type: "application/json",
      id: "tenant-config",
    )
  end

  def tenant_theme_style_tag
    variables = ActsAsTenant.current_tenant&.config&.theme&.css_variables
    return if variables.blank?

    declarations = variables.map { |name, value| "#{name}: #{value};" }.join(" ")

    content_tag(:style, raw("html:root { #{declarations} }"), nonce: content_security_policy_nonce)
  end
end
