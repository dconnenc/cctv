import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TenantProvider } from '@cctv/contexts';
import type { TenantConfig } from '@cctv/contexts';
import { Dialog } from '@cctv/core';
import { BlockKind } from '@cctv/types';

import { TEST_TENANT_CONFIG } from '../../../test-tenant';
import CreateBlock from './CreateBlock';

vi.mock('@cctv/contexts/ExperienceContext', () => ({
  useExperience: () => ({
    experience: { id: 'exp-1', code: 'CREATETEST', segments: [], blocks: [] },
    code: 'CREATETEST',
    isLoading: false,
    wsReady: true,
  }),
}));

vi.mock('@cctv/contexts/AdminAuthContext', () => ({
  useAdminAuth: () => ({ adminJWT: 'jwt', adminFetch: vi.fn(), isAdminLoading: false }),
}));

function renderCreateBlock(config: TenantConfig) {
  render(
    <TenantProvider config={config}>
      <Dialog open>
        <CreateBlock onClose={vi.fn()} participants={[]} onEndCurrentBlock={vi.fn()} />
      </Dialog>
    </TenantProvider>,
  );
}

describe('CreateBlock', () => {
  it('defaults to poll when every kind is allowed', () => {
    renderCreateBlock(TEST_TENANT_CONFIG);

    expect(screen.getByLabelText('Kind:')).toHaveValue(BlockKind.POLL);
  });

  it('defaults to the first allowed kind when poll is not allowed', () => {
    renderCreateBlock({ ...TEST_TENANT_CONFIG, blocks: [BlockKind.QUESTION] });

    expect(screen.getByLabelText('Kind:')).toHaveValue(BlockKind.QUESTION);
    expect(screen.getByLabelText('Input Type:')).toBeInTheDocument();
    expect(screen.queryByLabelText('Poll Question')).not.toBeInTheDocument();
  });
});
