module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      # For now, allow anonymous connections since we handle auth at the channel level
      # This could be enhanced later to do connection-level authentication
      "anonymous_#{SecureRandom.hex(8)}"
    end
  end
end
