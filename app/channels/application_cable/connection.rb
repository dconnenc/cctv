module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user
    attr_reader :tenant

    around_command :with_tenant

    def connect
      @tenant = Tenants::Resolver.call(request.host)
      self.current_user = find_verified_user
    rescue Tenants::Resolver::UnknownTenant
      reject_unauthorized_connection
    end

    private

    def with_tenant(&block)
      Tenants.with(tenant, &block)
    end

    def find_verified_user
      # For now, allow anonymous connections since we handle auth at the channel level
      # This could be enhanced later to do connection-level authentication
      "anonymous_#{SecureRandom.hex(8)}"
    end
  end
end
