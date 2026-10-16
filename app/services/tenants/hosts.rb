module Tenants
  module Hosts
    module_function

    def base_domain
      Rails.configuration.x.tenants.base_domain.presence ||
        URI(Rails.configuration.app_base_url).host
    end

    def host_for(tenant)
      tenant.default? ? base_domain : "#{tenant.key}.#{base_domain}"
    end

    def url_for(tenant)
      base_url = Rails.configuration.app_base_url
      return base_url if tenant.default?

      uri = URI(base_url)
      URI::Generic.build(
        scheme: uri.scheme,
        host: host_for(tenant),
        port: uri.port == uri.default_port ? nil : uri.port,
      ).to_s
    end
  end
end
