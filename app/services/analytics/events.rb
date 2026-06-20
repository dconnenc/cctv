module Analytics
  # Canonical event names. Keep these strings identical to the frontend
  # taxonomy in app/frontend/Analytics/events.ts so a single PostHog event
  # represents the same action regardless of which side emitted it.
  module Events
    EXPERIENCE_CREATED = "experience created".freeze
    PARTICIPANT_REGISTERED = "participant registered".freeze
    LOBBY_OPENED = "experience lobby opened".freeze
    EXPERIENCE_STARTED = "experience started".freeze
    EXPERIENCE_PAUSED = "experience paused".freeze
    EXPERIENCE_RESUMED = "experience resumed".freeze
    BLOCK_OPENED = "block opened".freeze
    BLOCK_CLOSED = "block closed".freeze
    RESPONSE_SUBMITTED = "response submitted".freeze
    AVATAR_SAVED = "avatar saved".freeze
  end
end
