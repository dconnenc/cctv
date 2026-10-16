module Tenanted
  extend ActiveSupport::Concern

  included do
    acts_as_tenant :tenant
  end

  class_methods do
    def insert_all(attributes, **options)
      super(stamp_tenant(attributes), **options)
    end

    def insert_all!(attributes, **options)
      super(stamp_tenant(attributes), **options)
    end

    def upsert_all(attributes, **options)
      super(stamp_tenant(attributes), **options)
    end

    private

    def stamp_tenant(rows)
      tenant = ActsAsTenant.current_tenant
      raise ActsAsTenant::Errors::NoTenantSet if tenant.nil?

      rows.map { |row| row.merge(tenant_id: tenant.id) }
    end
  end
end
