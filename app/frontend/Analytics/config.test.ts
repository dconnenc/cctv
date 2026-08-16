import { afterEach, describe, expect, it, vi } from 'vitest';

const validConfig = {
  enabled: true,
  key: 'phc_test',
  host: 'https://us.i.posthog.com',
  environment: 'production',
  sessionReplay: false,
};

function setConfigBlock(json: string | null) {
  document.getElementById('analytics-config')?.remove();
  if (json === null) return;
  const script = document.createElement('script');
  script.type = 'application/json';
  script.id = 'analytics-config';
  script.textContent = json;
  document.head.appendChild(script);
}

// The module caches its first read, so each case loads a fresh module instance.
async function loadConfig() {
  vi.resetModules();
  return (await import('./config')).getAnalyticsConfig();
}

afterEach(() => setConfigBlock(null));

describe('getAnalyticsConfig', () => {
  it('returns null when the config block is absent', async () => {
    setConfigBlock(null);
    expect(await loadConfig()).toBeNull();
  });

  it('returns null when analytics is disabled', async () => {
    setConfigBlock(JSON.stringify({ ...validConfig, enabled: false }));
    expect(await loadConfig()).toBeNull();
  });

  it('returns null when the key is missing', async () => {
    setConfigBlock(JSON.stringify({ ...validConfig, key: null }));
    expect(await loadConfig()).toBeNull();
  });

  it('returns null when the host is missing', async () => {
    const { host: _host, ...withoutHost } = validConfig;
    setConfigBlock(JSON.stringify(withoutHost));
    expect(await loadConfig()).toBeNull();
  });

  it('returns null on malformed JSON', async () => {
    setConfigBlock('{ not valid json');
    expect(await loadConfig()).toBeNull();
  });

  it('parses a valid config block', async () => {
    setConfigBlock(JSON.stringify({ ...validConfig, sessionReplay: true }));
    expect(await loadConfig()).toEqual({
      enabled: true,
      key: 'phc_test',
      host: 'https://us.i.posthog.com',
      environment: 'production',
      sessionReplay: true,
    });
  });

  it('defaults environment and sessionReplay when omitted', async () => {
    setConfigBlock(
      JSON.stringify({ enabled: true, key: 'phc_test', host: 'https://us.i.posthog.com' }),
    );
    const config = await loadConfig();
    expect(config?.environment).toBe('unknown');
    expect(config?.sessionReplay).toBe(false);
  });

  it('caches the result so a later DOM change is not re-read', async () => {
    setConfigBlock(JSON.stringify(validConfig));
    vi.resetModules();
    const { getAnalyticsConfig } = await import('./config');

    const first = getAnalyticsConfig();
    setConfigBlock(null);
    const second = getAnalyticsConfig();

    expect(second).toBe(first);
  });
});
