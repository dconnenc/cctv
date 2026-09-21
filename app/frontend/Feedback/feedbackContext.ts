import posthog from 'posthog-js';

import { isAnalyticsReady } from '@cctv/analytics';

/**
 * Keys the API accepts on a feedback report. Kept in sync with
 * Feedbacks::Sanitizer::PERMITTED_CONTEXT_KEYS — anything not listed there is
 * dropped server-side rather than stored.
 */
export interface FeedbackContextPayload {
  url?: string;
  route?: string;
  experience_code?: string;
  experience_status?: string;
  participant_role?: string;
  segment_names?: string[];
  visible_block_kinds?: string[];
  block_id?: string;
  viewport?: string;
  user_agent?: string;
  locale?: string;
  timezone?: string;
  release?: string;
  posthog_session_id?: string;
  posthog_replay_url?: string;
  error_message?: string;
  error_stack?: string;
  error_source?: string;
  http_status?: number;
  http_url?: string;
}

/**
 * The feedback trigger is mounted above the router so opening it never unmounts
 * the experience the user is in. That puts it outside ExperienceProvider, so the
 * experience writes its own state here instead and the panel reads it back.
 */
export interface ExperienceSnapshot {
  code: string;
  status: string;
  participantRole: string | null;
  segmentNames: string[];
  visibleBlockKinds: string[];
}

let experienceSnapshot: ExperienceSnapshot | null = null;
let currentRoute: string | null = null;

export function setExperienceSnapshot(snapshot: ExperienceSnapshot | null): void {
  experienceSnapshot = snapshot;
}

export function setFeedbackRoute(route: string): void {
  currentRoute = route;
}

export function buildFeedbackContext(
  overrides: FeedbackContextPayload = {},
): FeedbackContextPayload {
  const context: FeedbackContextPayload = {
    url: window.location.href,
    route: currentRoute ?? window.location.pathname,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    user_agent: navigator.userAgent,
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  if (experienceSnapshot) {
    context.experience_code = experienceSnapshot.code;
    context.experience_status = experienceSnapshot.status;
    context.segment_names = experienceSnapshot.segmentNames;
    context.visible_block_kinds = experienceSnapshot.visibleBlockKinds;
    if (experienceSnapshot.participantRole) {
      context.participant_role = experienceSnapshot.participantRole;
    }
  }

  const replay = replayContext();

  return { ...context, ...replay, ...overrides };
}

export function currentExperienceCode(): string | undefined {
  return experienceSnapshot?.code;
}

/**
 * A replay link turns "the poll didn't work" into a watchable reproduction, so
 * it is worth attaching whenever session recording happens to be enabled.
 */
function replayContext(): FeedbackContextPayload {
  if (!isAnalyticsReady()) return {};

  try {
    const sessionId = posthog.get_session_id();
    const replayUrl = posthog.get_session_replay_url({ withTimestamp: true });

    return {
      posthog_session_id: sessionId || undefined,
      posthog_replay_url: replayUrl || undefined,
    };
  } catch {
    return {};
  }
}
