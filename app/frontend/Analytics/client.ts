import posthog, { type Properties } from 'posthog-js';

import { getAnalyticsConfig } from './config';
import type { AnalyticsEventName } from './events';

/**
 * Centralized, guarded access to the posthog-js singleton. Every export is a
 * no-op until initAnalytics() has run with a valid server config, so importing
 * and calling these is always safe — including in tests and Storybook where
 * analytics never initializes.
 */
let initialized = false;

export function initAnalytics(): void {
  if (initialized) return;

  const config = getAnalyticsConfig();
  if (!config) return;

  posthog.init(config.key, {
    api_host: config.host,
    // Modern defaults: SPA pageviews via history_change + scripts injected into <head>.
    defaults: '2026-01-30',
    person_profiles: 'identified_only',
    capture_exceptions: true,
    disable_session_recording: !config.sessionReplay,
  });
  posthog.register({ environment: config.environment });
  initialized = true;
}

export function isAnalyticsReady(): boolean {
  return initialized;
}

export function capture(event: AnalyticsEventName, properties?: Properties): void {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function identifyUser(distinctId: string, properties?: Properties): void {
  if (!initialized) return;
  posthog.identify(distinctId, properties);
}

export function identifyExperienceGroup(experienceId: string, properties?: Properties): void {
  if (!initialized) return;
  posthog.group('experience', experienceId, properties);
}

export function setPersonProperties(properties: Properties): void {
  if (!initialized) return;
  posthog.setPersonProperties(properties);
}

export function resetAnalytics(): void {
  if (!initialized) return;
  posthog.reset();
}

export function captureException(error: unknown, properties?: Properties): void {
  if (!initialized) return;
  posthog.captureException(error, properties);
}
