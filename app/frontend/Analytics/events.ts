/**
 * Canonical analytics event names. Keep these strings identical to the backend
 * taxonomy in app/services/analytics/events.rb so each PostHog event represents
 * the same action no matter which side emitted it.
 *
 * Authoritative domain events (created, registered, lifecycle, block open/close,
 * response submitted, avatar saved) are emitted server-side. The frontend owns
 * pageviews and exceptions (autocaptured) plus client-funnel events like joining.
 */
export const AnalyticsEvent = {
  ExperienceJoined: 'experience joined',
  ExperienceCreated: 'experience created',
  ParticipantRegistered: 'participant registered',
  LobbyOpened: 'experience lobby opened',
  ExperienceStarted: 'experience started',
  ExperiencePaused: 'experience paused',
  ExperienceResumed: 'experience resumed',
  BlockOpened: 'block opened',
  BlockClosed: 'block closed',
  ResponseSubmitted: 'response submitted',
  AvatarSaved: 'avatar saved',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];
