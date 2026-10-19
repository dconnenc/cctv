ActiveSupport.on_load(:active_storage_blob) { include Tenanted }
ActiveSupport.on_load(:active_storage_attachment) { include Tenanted }
ActiveSupport.on_load(:active_storage_variant_record) { include Tenanted }

Rails.application.config.to_prepare do
  ActiveStorage::BaseController.include(TenantScoped)
end
