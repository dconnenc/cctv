import { beforeEach, describe, expect, it, vi } from 'vitest';

const { posthogMock, configMock } = vi.hoisted(() => ({
  posthogMock: {
    init: vi.fn(),
    register: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    group: vi.fn(),
    setPersonProperties: vi.fn(),
    reset: vi.fn(),
    captureException: vi.fn(),
  },
  configMock: { getAnalyticsConfig: vi.fn() },
}));

vi.mock('posthog-js', () => ({ default: posthogMock }));
vi.mock('./config', () => configMock);

const validConfig = {
  enabled: true,
  key: 'phc_test',
  host: 'https://us.i.posthog.com',
  environment: 'production',
  sessionReplay: false,
};

// Each case loads a fresh client so its module-level `initialized` flag resets.
async function loadClient() {
  vi.resetModules();
  return import('./client');
}

async function loadInitializedClient(config = validConfig) {
  configMock.getAnalyticsConfig.mockReturnValue(config);
  const client = await loadClient();
  client.initAnalytics();
  return client;
}

beforeEach(() => {
  vi.clearAllMocks();
  configMock.getAnalyticsConfig.mockReturnValue(null);
});

describe('analytics client before initialization', () => {
  it('makes every call a no-op without touching posthog', async () => {
    const client = await loadClient();

    client.capture('experience joined', { a: 1 });
    client.identifyUser('u1');
    client.identifyExperienceGroup('e1');
    client.setPersonProperties({ role: 'host' });
    client.resetAnalytics();
    client.captureException(new Error('x'));

    expect(client.isAnalyticsReady()).toBe(false);
    expect(posthogMock.capture).not.toHaveBeenCalled();
    expect(posthogMock.identify).not.toHaveBeenCalled();
    expect(posthogMock.group).not.toHaveBeenCalled();
    expect(posthogMock.reset).not.toHaveBeenCalled();
    expect(posthogMock.captureException).not.toHaveBeenCalled();
  });
});

describe('initAnalytics', () => {
  it('does not initialize when there is no config', async () => {
    configMock.getAnalyticsConfig.mockReturnValue(null);
    const { initAnalytics, isAnalyticsReady } = await loadClient();

    initAnalytics();

    expect(posthogMock.init).not.toHaveBeenCalled();
    expect(isAnalyticsReady()).toBe(false);
  });

  it('initializes posthog with SPA + error-tracking options and registers the environment', async () => {
    const { isAnalyticsReady } = await loadInitializedClient();

    expect(posthogMock.init).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({
        api_host: 'https://us.i.posthog.com',
        defaults: '2026-01-30',
        person_profiles: 'identified_only',
        capture_exceptions: true,
        disable_session_recording: true,
      }),
    );
    expect(posthogMock.register).toHaveBeenCalledWith({ environment: 'production' });
    expect(isAnalyticsReady()).toBe(true);
  });

  it('enables session recording when sessionReplay is on', async () => {
    await loadInitializedClient({ ...validConfig, sessionReplay: true });

    expect(posthogMock.init).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({ disable_session_recording: false }),
    );
  });

  it('is idempotent', async () => {
    const { initAnalytics } = await loadInitializedClient();
    initAnalytics();
    expect(posthogMock.init).toHaveBeenCalledTimes(1);
  });
});

describe('analytics client after initialization', () => {
  it('forwards capture to posthog', async () => {
    const { capture } = await loadInitializedClient();
    capture('experience joined', { status: 'registered' });
    expect(posthogMock.capture).toHaveBeenCalledWith('experience joined', { status: 'registered' });
  });

  it('forwards identifyUser to posthog.identify', async () => {
    const { identifyUser } = await loadInitializedClient();
    identifyUser('user-1', { email: 'a@b.com' });
    expect(posthogMock.identify).toHaveBeenCalledWith('user-1', { email: 'a@b.com' });
  });

  it('forwards identifyExperienceGroup to posthog.group with the experience group type', async () => {
    const { identifyExperienceGroup } = await loadInitializedClient();
    identifyExperienceGroup('exp-1', { code: 'ABC' });
    expect(posthogMock.group).toHaveBeenCalledWith('experience', 'exp-1', { code: 'ABC' });
  });

  it('forwards resetAnalytics to posthog.reset', async () => {
    const { resetAnalytics } = await loadInitializedClient();
    resetAnalytics();
    expect(posthogMock.reset).toHaveBeenCalledTimes(1);
  });

  it('forwards captureException to posthog.captureException', async () => {
    const { captureException } = await loadInitializedClient();
    const error = new Error('boom');
    captureException(error, { source: 'test' });
    expect(posthogMock.captureException).toHaveBeenCalledWith(error, { source: 'test' });
  });
});
