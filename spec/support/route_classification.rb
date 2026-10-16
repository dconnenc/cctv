module RouteClassification
  module_function

  def routes
    Rails.application.routes.routes
  end

  def mounted?(route)
    !route.dispatcher?
  end

  def spa?(route)
    route.defaults[:controller] == "spa"
  end

  def feature_for(route)
    return unless route.app.is_a?(ActionDispatch::Routing::Mapper::Constraints)

    route.app.constraints.grep(Tenants::FeatureConstraint).first&.feature
  end

  def path(route)
    route.path.spec.to_s.delete_suffix("(.:format)")
  end

  def label(route)
    "#{route.verb} #{path(route)} #{route.defaults[:controller]}##{route.defaults[:action]}"
  end

  def gated_routes
    routes.select { |route| feature_for(route) }
  end
end
