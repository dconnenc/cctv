import { ReactNode } from 'react';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { RenderOptions, render } from '@testing-library/react';

import { ExperienceProvider } from '@cctv/contexts/ExperienceContext';

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
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/experience/:code/*"
          element={<ExperienceProvider>{children}</ExperienceProvider>}
        />
      </Routes>
    </MemoryRouter>
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
