module Tenanted
  extend ActiveSupport::Concern

  included do
    acts_as_tenant :tenant
  end
end
