module Tenants
  class Theme < Dry::Struct
    CSS_VARIABLE_NAME = /\A--[a-z0-9-]+\z/
    CSS_VARIABLE_VALUE = %r{\A(?!.*/\*)(?!.*url\()[A-Za-z0-9#%.,()\s/\-]+\z}mi

    schema schema.strict

    attribute :display_name, Types::Strict::String.constrained(min_size: 1)
    attribute :tagline, Types::Strict::String
    attribute :ticket_tagline, Types::Strict::String
    attribute :site_name, Types::Strict::String.constrained(min_size: 1)
    attribute :description, Types::Strict::String.constrained(min_size: 1)
    attribute :css_variables,
      Types::Hash.map(
        Types::Strict::String.constrained(format: CSS_VARIABLE_NAME),
        Types::Strict::String.constrained(format: CSS_VARIABLE_VALUE),
      ).default({}.freeze)
  end
end
