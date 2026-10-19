import { BlockKind } from '@cctv/types';

import type { TenantConfig } from './Contexts/TenantContext';

export const TEST_TENANT_CONFIG: TenantConfig = {
  key: 'cctv',
  name: 'CCTV',
  features: ['events', 'performers', 'discover'],
  blocks: Object.values(BlockKind),
  theme: {
    displayName: 'CCTV',
    tagline: 'CHICAGO COMEDY . TV',
    ticketTagline: 'CHICAGO COMEDY TV',
  },
};
