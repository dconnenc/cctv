module Tenants
  module Registry
    DEFAULT_KEY = "cctv".freeze
    RESERVED_KEYS = %w[www api admin cable assets static mail].freeze

    class UnknownTenant < StandardError; end

    module_function

    def all
      Definitions.constants.sort.map { |name| Definitions.const_get(name) }
    end

    def keys
      all.map(&:key)
    end

    def fetch(key)
      all.find { |config| config.key == key.to_s } ||
        raise(UnknownTenant, "no tenant registered for #{key.inspect}")
    end

    def default
      fetch(DEFAULT_KEY)
    end

    def validate!
      registered = keys
      duplicates = registered.tally.select { |_, count| count > 1 }.keys
      reserved = registered & RESERVED_KEYS

      raise ArgumentError, "duplicate tenant keys: #{duplicates.join(', ')}" if duplicates.any?
      raise ArgumentError, "reserved tenant keys: #{reserved.join(', ')}" if reserved.any?
      raise ArgumentError, "default tenant #{DEFAULT_KEY} is not registered" unless registered.include?(DEFAULT_KEY)

      true
    end
  end
end
