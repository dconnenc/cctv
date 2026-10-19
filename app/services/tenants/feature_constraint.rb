module Tenants
  class FeatureConstraint
    attr_reader :feature

    def initialize(feature)
      @feature = feature
    end

    def matches?(request)
      Resolver.call(request.host).config.feature?(@feature)
    rescue Resolver::UnknownTenant
      false
    end
  end
end
