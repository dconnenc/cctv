import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { BlockKind } from '@cctv/types';

import {
  DEFAULT_TENANT_CONFIG,
  TenantConfig,
  TenantProvider,
  readTenantConfig,
  useTenant,
} from './TenantContext';

const writeConfig = (value: string) => {
  const script = document.createElement('script');
  script.type = 'application/json';
  script.id = 'tenant-config';
  script.textContent = value;
  document.body.appendChild(script);
};

afterEach(() => {
  document.getElementById('tenant-config')?.remove();
});

describe('readTenantConfig', () => {
  it('falls back to the default config when the tag is missing', () => {
    expect(readTenantConfig()).toEqual(DEFAULT_TENANT_CONFIG);
  });

  it('falls back to the default config when the JSON is malformed', () => {
    writeConfig('{not json');

    expect(readTenantConfig()).toEqual(DEFAULT_TENANT_CONFIG);
  });

  it('falls back to the default config when required fields are missing', () => {
    writeConfig(JSON.stringify({ key: 'quiz', features: [], blocks: ['poll'] }));

    expect(readTenantConfig()).toEqual(DEFAULT_TENANT_CONFIG);
  });

  it('reads the tenant config from the page', () => {
    writeConfig(
      JSON.stringify({
        key: 'quiz',
        name: 'Quiz',
        features: [],
        blocks: ['poll'],
        theme: { displayName: 'Quiz', tagline: '' },
      }),
    );

    expect(readTenantConfig()).toEqual({
      key: 'quiz',
      name: 'Quiz',
      features: [],
      blocks: ['poll'],
      theme: { displayName: 'Quiz', tagline: '' },
    });
  });

  it('reads the theme tagline', () => {
    writeConfig(
      JSON.stringify({
        key: 'quiz',
        name: 'Quiz',
        features: [],
        blocks: ['poll'],
        theme: { displayName: 'Quiz', tagline: 'QUIZ NIGHT' },
      }),
    );

    expect(readTenantConfig().theme).toEqual({ displayName: 'Quiz', tagline: 'QUIZ NIGHT' });
  });

  it('falls back to the default config when the tagline is missing', () => {
    writeConfig(
      JSON.stringify({
        key: 'quiz',
        name: 'Quiz',
        features: [],
        blocks: ['poll'],
        theme: { displayName: 'Quiz' },
      }),
    );

    expect(readTenantConfig()).toEqual(DEFAULT_TENANT_CONFIG);
  });

  it('drops unknown features and non-string blocks', () => {
    writeConfig(
      JSON.stringify({
        key: 'quiz',
        name: 'Quiz',
        features: ['events', 'teleport'],
        blocks: ['poll', 7],
        theme: { displayName: 'Quiz', tagline: '' },
      }),
    );

    expect(readTenantConfig()).toMatchObject({ features: ['events'], blocks: ['poll'] });
  });
});

describe('useTenant', () => {
  const quiz: TenantConfig = {
    key: 'quiz',
    name: 'Quiz',
    features: [],
    blocks: ['poll'],
    theme: { displayName: 'Quiz', tagline: '' },
  };

  it('answers feature and block queries from the provided config', () => {
    const { result } = renderHook(() => useTenant(), {
      wrapper: ({ children }) => <TenantProvider config={quiz}>{children}</TenantProvider>,
    });

    expect(result.current.hasFeature('events')).toBe(false);
    expect(result.current.isBlockAllowed(BlockKind.POLL)).toBe(true);
    expect(result.current.isBlockAllowed(BlockKind.THE_SCENE)).toBe(false);
  });

  it('allows everything under the default config', () => {
    const { result } = renderHook(() => useTenant());

    expect(result.current.hasFeature('events')).toBe(true);
    expect(result.current.isBlockAllowed(BlockKind.THE_SCENE)).toBe(true);
  });
});
