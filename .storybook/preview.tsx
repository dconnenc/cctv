import React from 'react';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { Preview } from '@storybook/react-vite';

import { ExperienceProvider } from '../app/frontend/Contexts/ExperienceContext';
import { UserProvider } from '../app/frontend/Contexts/UserContext';

import '../app/frontend/styles.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: 'hsl(0 0% 5%)' },
        { name: 'light', value: 'hsl(0 0% 100%)' },
      ],
    },
    a11y: {
      test: 'todo',
    },
  },
  decorators: [
    (Story) => {
      document.documentElement.setAttribute('data-theme', 'dark');
      return (
        <MemoryRouter initialEntries={['/experience/DEMO']}>
          <UserProvider>
            <Routes>
              <Route
                path="/experience/:code"
                element={
                  <ExperienceProvider>
                    <Story />
                  </ExperienceProvider>
                }
              />
            </Routes>
          </UserProvider>
        </MemoryRouter>
      );
    },
  ],
};

export default preview;
