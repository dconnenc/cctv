module Tenants
  class FeatureConstraint
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
