module Tenants
  module_function

  def with(tenant_or_key, &block)
    tenant = tenant_or_key.is_a?(Tenant) ? tenant_or_key : Tenant.find_by!(key: tenant_or_key.to_s)
    ActsAsTenant.with_tenant(tenant, &block)
  end

  def each
    Tenant.where(key: Registry.keys).order(:key).each do |tenant|
      with(tenant) { yield tenant }
    end
  end
end
