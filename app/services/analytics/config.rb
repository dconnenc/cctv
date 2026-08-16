module Analytics
  module Config
    DEFAULT_HOST = "https://us.i.posthog.com".freeze

    module_function

    def enabled?
      ENV["POSTHOG_API_KEY"].present? && !Rails.env.test?
    end

    def key
      ENV["POSTHOG_API_KEY"].presence
    end

    # Always resolves to a host. The browser config block is rejected client-side
    # when `host` is missing, so returning nil here would silently disable all
    # frontend analytics in any environment that sets a key but not a host.
    def host
      ENV.fetch("POSTHOG_HOST", DEFAULT_HOST).presence || DEFAULT_HOST
    end

    def session_replay?
      ActiveModel::Type::Boolean.new.cast(ENV["POSTHOG_SESSION_REPLAY"]) == true
    end

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
