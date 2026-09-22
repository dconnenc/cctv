default_redis_url = Rails.env.test? ? "redis://localhost:6379/2" : "redis://localhost:6379/1"

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", default_redis_url) }
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", default_redis_url) }
end
