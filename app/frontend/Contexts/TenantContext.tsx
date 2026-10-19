import { PropsWithChildren, createContext, useContext, useMemo } from 'react';

import { JsonValue } from '@cctv/types';

const TENANT_FEATURES = ['events', 'performers', 'discover'] as const;

export type TenantFeature = (typeof TENANT_FEATURES)[number];

export interface TenantConfig {
  key: string;
  name: string;
  features: TenantFeature[];
  blocks: string[];
  theme: { displayName: string; tagline: string; ticketTagline: string };
}

const isTenantFeature = (value: JsonValue): value is TenantFeature =>
  TENANT_FEATURES.some((feature) => feature === value);

const isString = (value: JsonValue): value is string => value === String(value);

function parseTenantConfig(raw: JsonValue): TenantConfig | null {
  if (raw === null || Array.isArray(raw) || !(raw instanceof Object)) return null;

  const { key, name, features, blocks, theme } = raw;
  if (!isString(key) || !key || !isString(name) || !name) return null;
  if (!Array.isArray(features) || !Array.isArray(blocks)) return null;
  if (theme === null || Array.isArray(theme) || !(theme instanceof Object)) return null;

  const { displayName, tagline, ticketTagline } = theme;
  if (!isString(displayName) || !displayName || !isString(tagline)) return null;
  if (!isString(ticketTagline)) return null;

  return {
    key,
    name,
    features: features.filter(isTenantFeature),
    blocks: blocks.filter(isString),
    theme: { displayName, tagline, ticketTagline },
  };
}

const TENANT_CONFIG_ERROR = 'tenant-config script missing or invalid';

export function readTenantConfig(doc: Document = document): TenantConfig {
  const element = doc.getElementById('tenant-config');
  if (!element?.textContent) throw new Error(TENANT_CONFIG_ERROR);

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(element.textContent);
  } catch {
    throw new Error(TENANT_CONFIG_ERROR);
  }

  const config = parseTenantConfig(parsed);
  if (!config) throw new Error(TENANT_CONFIG_ERROR);
  return config;
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

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps extends PropsWithChildren {
  config?: TenantConfig;
}

export function TenantProvider({ config, children }: TenantProviderProps) {
  const value = useMemo(() => buildValue(config ?? readTenantConfig()), [config]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const value = useContext(TenantContext);
  if (!value) throw new Error('useTenant must be used within a TenantProvider');
  return value;
}
