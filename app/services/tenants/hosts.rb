module Tenants
  module Hosts
    module_function

    def base_url
      Rails.configuration.x.tenants.base_url
    end

    def base_uri
      URI(base_url)
    end

    def base_domain
      base_uri.host
    end

    def host_for(tenant)
      tenant.default? ? base_domain : "#{tenant.key}.#{base_domain}"
    end

    def url_for(tenant)
      return base_url.chomp("/") if tenant.default?

      URI::Generic.build(scheme: base_uri.scheme, host: host_for(tenant), port: explicit_port).to_s
    end

    def mailer_options(tenant)
      { host: host_for(tenant), protocol: base_uri.scheme, port: explicit_port }.compact
    end

    def validate!
      raise ArgumentError, "APP_BASE_URL is not set" if base_url.blank?
      if base_uri.scheme.blank? || base_uri.host.blank?
        raise ArgumentError, "APP_BASE_URL must include a scheme, e.g. https://chicagocomedy.tv (got #{base_url.inspect})"
      end
      raise ArgumentError, "APP_BASE_URL host must not start with www. (got #{base_url.inspect})" if base_domain.start_with?("www.")

      true
    end

    def explicit_port
      base_uri.port == base_uri.default_port ? nil : base_uri.port
    end
  end
end
