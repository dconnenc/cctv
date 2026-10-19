import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { TenantProvider, ThemeProvider, UserProvider } from '@cctv/contexts';

import { server } from '../../test-msw';
import { TEST_TENANT_CONFIG } from '../../test-tenant';
import { TopNav } from './TopNav';

const renderNav = (config = TEST_TENANT_CONFIG) => {
  server.use(http.get('/api/users/me', () => new HttpResponse(null, { status: 401 })));

  return render(
    <TenantProvider config={config}>
      <MemoryRouter>
        <ThemeProvider>
          <UserProvider>
            <TopNav />
          </UserProvider>
        </ThemeProvider>
      </MemoryRouter>
    </TenantProvider>,
  );
};

const publicLinks = () =>
  screen
    .queryAllByRole('link', { hidden: true })
    .map((link) => link.getAttribute('href'))
    .filter((href) => href?.startsWith('/events') || href?.startsWith('/performers'));

describe('TopNav', () => {
  it('links to events and performers when the features are enabled', () => {
    renderNav();

    expect(publicLinks()).toEqual(expect.arrayContaining(['/events', '/performers']));
  });

  it('hides every events and performers link when the features are disabled', () => {
    renderNav({ ...TEST_TENANT_CONFIG, features: [] });

    expect(publicLinks()).toEqual([]);
  });
});
