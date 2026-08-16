import type { Properties } from 'posthog-js';

import { capture } from './client';
import { AnalyticsEvent } from './events';

/**
 * Records what the operator did in the tech booth while a show was running, so a
 * run can be replayed as a sequence of decisions.
 *
 * Button presses are already covered generically by Core `Button`; this exists
 * for the manage interactions that never go through a button — drag reordering,
 * impersonation switches, selecting a block in the program table — which would
 * otherwise leave gaps in that timeline.
 */
export function trackManageAction(action: string, properties: Properties = {}): void {
  capture(AnalyticsEvent.ManageAction, { action, ...properties });
}
