module TenantMailerUrlOptions
  def default_url_options
    tenant = ActsAsTenant.current_tenant
    raise ActsAsTenant::Errors::NoTenantSet if tenant.nil?

    super.merge(Tenants::Hosts.mailer_options(tenant))
  end
end
