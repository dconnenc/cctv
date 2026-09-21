module Linear
  # Env-gated like Analytics::Config so development, test and any deploy without
  # credentials simply skip Linear rather than raising on every submission.
  module Config
    API_URL = "https://api.linear.app/graphql".freeze

    module_function

    def enabled?
      return false if Rails.env.test?
      return false if api_key.blank?

      if team_key.blank?
        Rails.logger.warn("[Linear] LINEAR_API_KEY is set but LINEAR_TEAM_KEY is not; skipping sync")
        return false
      end

      true
    end

    def api_key
      ENV["LINEAR_API_KEY"].presence
    end

    # Resolved by the team's short key — the prefix on issue identifiers, e.g.
    # "CHI" for CHI-142 — rather than a UUID, so the value stays readable.
    # Deliberately has no default: guessing it would produce issues filed against
    # the wrong team, or a retry loop against a team that does not exist.
    def team_key
      ENV["LINEAR_TEAM_KEY"].presence
    end

    def project_id
      ENV["LINEAR_PROJECT_ID"].presence
    end

    def api_url
      API_URL
    end
  end
end
