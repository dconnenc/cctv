export interface AnalyticsConfig {
  enabled: boolean;
  key: string;
  host: string;
  environment: string;
  sessionReplay: boolean;
}

let cached: AnalyticsConfig | null | undefined;

/**
 * Reads the analytics config the server embedded as a JSON data block. Returns
 * null when analytics is disabled or the block is absent (dev without a key,
 * test, Storybook), which keeps the SDK from ever starting in those contexts.
 */
export function getAnalyticsConfig(): AnalyticsConfig | null {
  if (cached !== undefined) return cached;
  cached = readConfig();
  return cached;
}

function readConfig(): AnalyticsConfig | null {
  if (typeof document === 'undefined') return null;

  const element = document.getElementById('analytics-config');
  if (!element?.textContent) return null;

  try {
    const parsed = JSON.parse(element.textContent) as Partial<AnalyticsConfig>;
    if (!parsed.enabled || !parsed.key || !parsed.host) return null;

    return {
      enabled: true,
      key: parsed.key,
      host: parsed.host,
      environment: parsed.environment ?? 'unknown',
      sessionReplay: parsed.sessionReplay ?? false,
    };
  } catch {
    return null;
  }
}
