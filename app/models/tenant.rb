class Tenant < ApplicationRecord
  validates :key, presence: true, uniqueness: true, format: { with: Tenants::Config::KEY_FORMAT }
  validates :name, presence: true

  def self.default
    find_by!(key: Tenants::Registry::DEFAULT_KEY)
  end

  def default?
    key == Tenants::Registry::DEFAULT_KEY
  end

  def config
    Tenants::Registry.fetch(key)
  end
end
