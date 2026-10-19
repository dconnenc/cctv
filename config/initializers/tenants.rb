Rails.application.config.after_initialize do
  Tenants::Registry.validate!
  Tenants::Hosts.validate!
end
