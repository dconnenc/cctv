module Analytics
  # Thin, failure-tolerant wrapper around the PostHog client. Analytics must
  # never break a request: every call is guarded and any error is logged and
  # swallowed. When PostHog is not configured the underlying client is disabled
  # and these calls are no-ops.
  module Tracker
    EXPERIENCE_GROUP = "experience".freeze

    module_function

    # distinct_id should be the User#id so backend events stitch to the
    # frontend, which identifies with the same id. Pass `experience` to attach
    # the event to that experience's PostHog group.
    def capture(distinct_id:, event:, properties: {}, experience: nil)
      return if distinct_id.blank?

      attrs = {
        distinct_id: distinct_id,
        event: event,
        properties: event_properties(properties, experience),
      }
      attrs[:groups] = { EXPERIENCE_GROUP => experience.id } if experience

      PostHog.capture(attrs)
    rescue StandardError => e
      warn_failure("capture", e)
    end

    def identify(distinct_id:, properties: {})
      return if distinct_id.blank?

      PostHog.identify(distinct_id: distinct_id, properties: properties)
    rescue StandardError => e
      warn_failure("identify", e)
    end

    def identify_experience(experience)
      return if experience.blank?

      PostHog.group_identify(
        group_type: EXPERIENCE_GROUP,
        group_key: experience.id,
        properties: {
          name: experience.name,
          code: experience.code,
        },
      )
    rescue StandardError => e
      warn_failure("identify_experience", e)
    end

    def capture_exception(exception, distinct_id: nil, properties: {})
      PostHog.capture_exception(exception, distinct_id, properties)
    rescue StandardError => e
      warn_failure("capture_exception", e)
    end

    def event_properties(properties, experience)
      return properties unless experience

      properties.merge(
        experience_code: experience.code,
        experience_name: experience.name,
      )
    end
    private_class_method :event_properties

    def warn_failure(operation, error)
      Rails.logger.warn("[PostHog] #{operation} failed: #{error.class} #{error.message}")
      nil
    end
    private_class_method :warn_failure
  end
end
