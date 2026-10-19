module Tenants
  class Config < Dry::Struct
    KEY_FORMAT = /\A[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\z/
    FEATURES = %w[events performers discover].freeze

    schema schema.strict

    attribute :key, Types::Strict::String.constrained(format: KEY_FORMAT)
    attribute :name, Types::Strict::String.constrained(min_size: 1)
    attribute :blocks,
      Types::Strict::Array
        .of(Types::Strict::String.enum(*ExperienceBlock::KINDS))
        .constrained(min_size: 1)
    attribute :features, Types::Strict::Array.of(Types::Strict::String.enum(*FEATURES))
    attribute :theme, Theme

    def feature?(name)
      features.include?(name.to_s)
    end

    def block_allowed?(kind)
      blocks.include?(kind.to_s)
    end
  end
end
