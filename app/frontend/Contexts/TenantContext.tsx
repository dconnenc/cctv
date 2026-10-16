import { PropsWithChildren, createContext, useContext, useMemo } from 'react';

import { BlockKind, JsonValue } from '@cctv/types';

const TENANT_FEATURES = ['events', 'performers', 'discover'] as const;

export type TenantFeature = (typeof TENANT_FEATURES)[number];

export interface TenantConfig {
  key: string;
  name: string;
  features: TenantFeature[];
  blocks: string[];
  theme: { displayName: string };
}

export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  key: 'cctv',
  name: 'CCTV',
  features: [...TENANT_FEATURES],
  blocks: Object.values(BlockKind),
  theme: { displayName: 'CCTV' },
};

const isTenantFeature = (value: JsonValue): value is TenantFeature =>
  TENANT_FEATURES.some((feature) => feature === value);

const isString = (value: JsonValue): value is string => value === String(value);

function parseTenantConfig(raw: JsonValue): TenantConfig | null {
  if (raw === null || Array.isArray(raw) || !(raw instanceof Object)) return null;

  const { key, name, features, blocks, theme } = raw;
  if (!isString(key) || !key || !isString(name) || !name) return null;
  if (!Array.isArray(features) || !Array.isArray(blocks)) return null;
  if (theme === null || Array.isArray(theme) || !(theme instanceof Object)) return null;

  const { displayName } = theme;
  if (!isString(displayName) || !displayName) return null;

  return {
    key,
    name,
    features: features.filter(isTenantFeature),
    blocks: blocks.filter(isString),
    theme: { displayName },
  };
}

export function readTenantConfig(doc: Document = document): TenantConfig {
  const element = doc.getElementById('tenant-config');
  if (!element?.textContent) return DEFAULT_TENANT_CONFIG;

  try {
    const parsed: JsonValue = JSON.parse(element.textContent);
    return parseTenantConfig(parsed) ?? DEFAULT_TENANT_CONFIG;
  } catch {
    return DEFAULT_TENANT_CONFIG;
  }
}

interface TenantContextValue {
  config: TenantConfig;
  hasFeature: (feature: TenantFeature) => boolean;
  isBlockAllowed: (kind: string) => boolean;
}

const buildValue = (config: TenantConfig): TenantContextValue => ({
  config,
  hasFeature: (feature) => config.features.includes(feature),
  isBlockAllowed: (kind) => config.blocks.includes(kind),
});

const TenantContext = createContext<TenantContextValue>(buildValue(DEFAULT_TENANT_CONFIG));

interface TenantProviderProps extends PropsWithChildren {
  config?: TenantConfig;
}

export function TenantProvider({ config, children }: TenantProviderProps) {
  const value = useMemo(() => buildValue(config ?? readTenantConfig()), [config]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  return useContext(TenantContext);
}
