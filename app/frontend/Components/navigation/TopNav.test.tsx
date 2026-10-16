import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { DEFAULT_TENANT_CONFIG, TenantProvider } from '@cctv/contexts/TenantContext';
import { ThemeProvider } from '@cctv/contexts/ThemeContext';
import { UserProvider } from '@cctv/contexts/UserContext';

import { server } from '../../test-msw';
import { TopNav } from './TopNav';

const renderNav = (config = DEFAULT_TENANT_CONFIG) => {
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
    renderNav({ ...DEFAULT_TENANT_CONFIG, features: [] });

    expect(publicLinks()).toEqual([]);
  });
});
