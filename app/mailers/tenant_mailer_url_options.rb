module TenantMailerUrlOptions
  def default_url_options
    options = super
    tenant = ActsAsTenant.current_tenant
    return options if tenant.nil? || tenant.default?

    options.merge(host: Tenants::Hosts.host_for(tenant))
  end
end
