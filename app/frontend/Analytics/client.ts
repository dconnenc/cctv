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

/**
 * The monitor is a projected display with no user behind it. Nothing from that
 * route belongs in analytics, so this drops every event — including autocaptured
 * pageviews, clicks and web vitals — at the SDK boundary rather than relying on
 * each call site to remember.
 */
export function isMonitorView(): boolean {
  if (!('window' in globalThis)) return false;
  return window.location.pathname.includes('/monitor');
}

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
    before_send: (event) => (isMonitorView() ? null : event),
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

/**
 * Attaches the current route pattern to every subsequent event, so any breakdown
 * can be sliced by page without each call site passing it.
 */
export function registerRoute(pattern: string): void {
  if (!initialized) return;
  posthog.register({ route: pattern });
}

export function resetAnalytics(): void {
  if (!initialized) return;
  posthog.reset();
}

export function captureException(error: Error, properties?: Properties): void {
  if (!initialized) return;
  posthog.captureException(error, properties);
}
