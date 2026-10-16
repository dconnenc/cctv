module Tenants
  module Resolver
    class UnknownTenant < StandardError; end

    DEFAULT_ALIASES = %w[www].freeze

    module_function

    def call(host)
      normalized = host.to_s.downcase.delete_suffix(".")
      suffix = ".#{Hosts.base_domain.downcase}"
      return Tenant.default unless normalized.end_with?(suffix)

      key = normalized.delete_suffix(suffix)
      return Tenant.default if DEFAULT_ALIASES.include?(key)
      raise UnknownTenant, normalized if key.include?(".") || Registry.keys.exclude?(key)

      Tenant.find_by(key: key) || raise(UnknownTenant, normalized)
    end
  end
end
