Rails.application.config.after_initialize do
  Tenants::Registry.validate!
end
