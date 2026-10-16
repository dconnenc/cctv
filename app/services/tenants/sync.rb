module Tenants
  module Sync
    module_function

    def call
      tenants = Registry.all.map do |config|
        tenant = Tenant.find_or_initialize_by(key: config.key)
        tenant.update!(name: config.name)
        tenant
      end

      Tenants.each { provision_superadmins }
      tenants
    end

    def superadmin_emails
      ENV.fetch("SUPERADMIN_EMAILS", "").split(",").map { |email| email.strip.downcase }.compact_blank.uniq
    end

    def provision_superadmins
      superadmin_emails.each do |email|
        user = User.find_or_initialize_by(email: email)
        user.name = email.split("@").first if user.name.blank?
        user.update!(role: :superadmin)
      end
    end
  end
end
