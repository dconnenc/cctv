module Tenants
  class Theme < Dry::Struct
    schema schema.strict

    attribute :display_name, Types::Strict::String.constrained(min_size: 1)
  end
end
