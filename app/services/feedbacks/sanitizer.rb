module Feedbacks
  # Client-submitted context and console output can carry live credentials —
  # participant JWTs live in localStorage and routinely end up in request logs.
  # The browser redacts before sending; this repeats the pass server-side so a
  # crafted or stale client can never persist a token into a Linear issue.
  module Sanitizer
    REDACTED = "[redacted]".freeze

    JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]+/
    BEARER_PATTERN = /\b(?:bearer|authorization:?|api[_-]?key:?|token:?)\s+\S+/i
    EMAIL_PATTERN = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/
    OPAQUE_TOKEN_PATTERN = /\b[A-Za-z0-9_-]{40,}\b/

    # Keys the client is allowed to set. Anything else is dropped rather than
    # stored, so the shape of `context` stays a known contract instead of an
    # open bag that grows by accident.
    PERMITTED_CONTEXT_KEYS = %w[
      url
      route
      experience_code
      experience_status
      participant_role
      segment_names
      visible_block_kinds
      block_id
      viewport
      user_agent
      locale
      timezone
      release
      posthog_session_id
      posthog_replay_url
      error_message
      error_stack
      error_source
      http_status
      http_url
    ].freeze

    MAX_STRING_LENGTH = 4_000
    MAX_ARRAY_LENGTH = 50
    MAX_LOG_MESSAGE_LENGTH = 2_000

    module_function

    def scrub(value)
      case value
      when String then scrub_string(value)
      when Array then value.first(MAX_ARRAY_LENGTH).map { |item| scrub(item) }
      when Hash then value.transform_values { |item| scrub(item) }
      else value
      end
    end

    def scrub_string(value)
      value
        .gsub(JWT_PATTERN, REDACTED)
        .gsub(BEARER_PATTERN, REDACTED)
        .gsub(EMAIL_PATTERN, REDACTED)
        .gsub(OPAQUE_TOKEN_PATTERN, REDACTED)
        .truncate(MAX_STRING_LENGTH)
    end

    def context(raw)
      return {} unless raw.is_a?(Hash)

      raw
        .stringify_keys
        .slice(*PERMITTED_CONTEXT_KEYS)
        .transform_values { |value| scrub(value) }
    end

    def console_logs(raw)
      return [] unless raw.is_a?(Array)

      raw
        .last(Feedback::MAX_CONSOLE_LOGS)
        .filter_map { |entry| console_entry(entry) }
    end

    def console_entry(entry)
      return nil unless entry.is_a?(Hash)

      normalized = entry.stringify_keys
      message = normalized["message"].to_s
      return nil if message.blank?

      {
        "level" => normalized["level"].to_s.presence || "log",
        "at" => normalized["at"].to_s.presence,
        "message" => scrub_string(message).truncate(MAX_LOG_MESSAGE_LENGTH),
      }
    end
  end
end
