import { ReactNode } from 'react';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { RenderOptions, render } from '@testing-library/react';

import { ExperienceProvider } from '@cctv/contexts/ExperienceContext';
import { TenantProvider } from '@cctv/contexts/TenantContext';

import { TEST_TENANT_CONFIG } from './test-tenant';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  code?: string;
  route?: string;
  jwt?: string;
}

function TestProviders({
  children,
  code = 'test-code',
  route = '/experience/test-code',
  jwt,
}: {
  children: ReactNode;
  code?: string;
  route?: string;
  jwt?: string;
}) {
  if (jwt) {
    localStorage.setItem(`experience_jwt_${code}`, jwt);
  }

  return (
    <TenantProvider config={TEST_TENANT_CONFIG}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route
            path="/experience/:code/*"
            element={<ExperienceProvider>{children}</ExperienceProvider>}
          />
        </Routes>
      </MemoryRouter>
    </TenantProvider>
  );
}

export function renderWithProviders(
  ui: ReactNode,
  { code, route, jwt = 'test-participant-jwt', ...renderOptions }: RenderWithProvidersOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders code={code} route={route} jwt={jwt}>
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  });
}
