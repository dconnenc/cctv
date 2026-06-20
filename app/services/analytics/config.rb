module Analytics
  # Single source of truth for whether analytics is active and what config the
  # browser client needs. Read at request time (never cached) so a deploy can
  # flip analytics on/off purely via environment variables.
  module Config
    module_function

    DEFAULT_HOST = "https://us.i.posthog.com".freeze

    def enabled?
      ENV["POSTHOG_KEY"].present? && !Rails.env.test?
    end

    def key
      ENV["POSTHOG_KEY"].presence
    end

    def host
      ENV.fetch("POSTHOG_HOST", DEFAULT_HOST)
    end

    def session_replay?
      ActiveModel::Type::Boolean.new.cast(ENV["POSTHOG_SESSION_REPLAY"]) == true
    end

    # Serialized into the page for the browser SDK to read on boot.
    def client_config
      {
        enabled: enabled?,
        key: key,
        host: host,
        environment: Rails.env.to_s,
        sessionReplay: session_replay?,
      }
    end
  end
end
