/**
 * Canonical analytics event names. Keep these strings identical to the backend
 * taxonomy in app/services/analytics/events.rb so each PostHog event represents
 * the same action no matter which side emitted it.
 *
 * Authoritative domain events (created, registered, lifecycle, block open/close,
 * response submitted, avatar saved) are emitted server-side. The frontend owns
 * pageviews and exceptions (autocaptured) plus client-funnel events like joining.
 *
 * Client-only events (block impressions, button clicks, request timing/failures,
 * websocket health, manage actions) have no server counterpart because the server
 * cannot observe them — a participant who never saw a block never calls an endpoint.
 * These are declared here only; events.rb intentionally omits them.
 */
export const AnalyticsEvent = {
  ExperienceJoined: 'experience joined',
  BlockSeen: 'block seen',
  BlockSubmitFailed: 'block submit failed',
  ButtonClicked: 'button clicked',
  ApiRequestCompleted: 'api request completed',
  ApiRequestFailed: 'api request failed',
  WebsocketDisconnected: 'websocket disconnected',
  WebsocketReconnected: 'websocket reconnected',
  ManageAction: 'manage action',
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
  EventCreated: 'event_created',
  EventUpdated: 'event_updated',
  EventDeleted: 'event_deleted',
  PerformerProfileCreated: 'performer_profile_created',
  PerformerFollowed: 'performer_followed',
  PerformerUnfollowed: 'performer_unfollowed',
  BlockCreated: 'block_created',
  ParticipantKicked: 'participant_kicked',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];
