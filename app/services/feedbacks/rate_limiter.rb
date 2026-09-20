module Feedbacks
  # Feedback endpoints are reachable by every audience member, and error reports
  # are reachable anonymously, so both need a ceiling. Counters live in Redis —
  # shared across web processes, unlike the default per-process cache store.
  module RateLimiter
    WINDOW = 1.hour

    LIMITS = {
      Feedback::MANUAL => 20,
      Feedback::BLOCK => 20,
      Feedback::ERROR => 60
    }.freeze

    module_function

    # Returns false once the caller has exhausted its allowance for the window.
    def allow?(source:, identifier:)
      limit = LIMITS.fetch(source.to_s, LIMITS[Feedback::MANUAL])
      key = "feedback:rate:#{source}:#{identifier}"

      count = Sidekiq.redis do |redis|
        value = redis.incr(key)
        redis.expire(key, WINDOW.to_i) if value == 1
        value
      end

      count <= limit
    rescue StandardError => e
      # A Redis blip must not stop someone reporting a bug.
      Rails.logger.warn("[Feedback] rate limit check failed: #{e.class} #{e.message}")
      true
    end
  end
end
