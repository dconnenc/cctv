import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BlockKind } from '@cctv/types';

import { TEST_TENANT_CONFIG } from '../test-tenant';
import { TenantConfig, TenantProvider, readTenantConfig, useTenant } from './TenantContext';

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
  it('throws when the tag is missing', () => {
    expect(() => readTenantConfig()).toThrow('tenant-config script missing or invalid');
  });

  it('throws when the JSON is malformed', () => {
    writeConfig('{not json');

    expect(() => readTenantConfig()).toThrow('tenant-config script missing or invalid');
  });

  it('throws when required fields are missing', () => {
    writeConfig(JSON.stringify({ key: 'quiz', features: [], blocks: ['poll'] }));

    expect(() => readTenantConfig()).toThrow('tenant-config script missing or invalid');
  });

  it('round-trips the test fixture', () => {
    writeConfig(JSON.stringify(TEST_TENANT_CONFIG));

    expect(readTenantConfig()).toEqual(TEST_TENANT_CONFIG);
  });

  it('reads the tenant config from the page', () => {
    writeConfig(
      JSON.stringify({
        key: 'quiz',
        name: 'Quiz',
        features: [],
        blocks: ['poll'],
        theme: { displayName: 'Quiz', tagline: '', ticketTagline: '' },
      }),
    );

    expect(readTenantConfig()).toEqual({
      key: 'quiz',
      name: 'Quiz',
      features: [],
      blocks: ['poll'],
      theme: { displayName: 'Quiz', tagline: '', ticketTagline: '' },
    });
  });

  it('reads the theme tagline', () => {
    writeConfig(
      JSON.stringify({
        key: 'quiz',
        name: 'Quiz',
        features: [],
        blocks: ['poll'],
        theme: { displayName: 'Quiz', tagline: 'QUIZ NIGHT', ticketTagline: 'QUIZ' },
      }),
    );

    expect(readTenantConfig().theme).toEqual({
      displayName: 'Quiz',
      tagline: 'QUIZ NIGHT',
      ticketTagline: 'QUIZ',
    });
  });

  it('throws when the tagline is missing', () => {
    writeConfig(
      JSON.stringify({
        key: 'quiz',
        name: 'Quiz',
        features: [],
        blocks: ['poll'],
        theme: { displayName: 'Quiz' },
      }),
    );

    expect(() => readTenantConfig()).toThrow('tenant-config script missing or invalid');
  });

  it('throws when the ticket tagline is missing', () => {
    writeConfig(
      JSON.stringify({
        key: 'quiz',
        name: 'Quiz',
        features: [],
        blocks: ['poll'],
        theme: { displayName: 'Quiz', tagline: '' },
      }),
    );

    expect(() => readTenantConfig()).toThrow('tenant-config script missing or invalid');
  });

  it('drops unknown features and non-string blocks', () => {
    writeConfig(
      JSON.stringify({
        key: 'quiz',
        name: 'Quiz',
        features: ['events', 'teleport'],
        blocks: ['poll', 7],
        theme: { displayName: 'Quiz', tagline: '', ticketTagline: '' },
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
    theme: { displayName: 'Quiz', tagline: '', ticketTagline: '' },
  };

  it('answers feature and block queries from the provided config', () => {
    const { result } = renderHook(() => useTenant(), {
      wrapper: ({ children }) => <TenantProvider config={quiz}>{children}</TenantProvider>,
    });

    expect(result.current.hasFeature('events')).toBe(false);
    expect(result.current.isBlockAllowed(BlockKind.POLL)).toBe(true);
    expect(result.current.isBlockAllowed(BlockKind.THE_SCENE)).toBe(false);
  });

  it('throws outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useTenant())).toThrow(
      'useTenant must be used within a TenantProvider',
    );
  });
});
