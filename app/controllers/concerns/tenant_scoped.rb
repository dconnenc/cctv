module TenantScoped
  extend ActiveSupport::Concern

  included do
    around_action :with_current_tenant
    rescue_from Tenants::Resolver::UnknownTenant, with: :render_unknown_tenant
  end

  private

  def with_current_tenant(&block)
    ActsAsTenant.with_tenant(Tenants::Resolver.call(request.host), &block)
  end

  def render_unknown_tenant
    head :not_found
  end
end
