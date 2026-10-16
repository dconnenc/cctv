module Tenants
  module Sync
    module_function

    def call
      Registry.all.map do |config|
        tenant = Tenant.find_or_initialize_by(key: config.key)
        tenant.update!(name: config.name)
        tenant
      end
    end
  end
end
