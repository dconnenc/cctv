import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeProvider } from '@cctv/contexts/ThemeContext';

import { AnalyticsErrorBoundary } from './AnalyticsErrorBoundary';

function Boom(): never {
  throw new Error('Storybook demo: simulated render error');
}

const meta: Meta<typeof AnalyticsErrorBoundary> = {
  title: 'Analytics/AnalyticsErrorBoundary',
  component: AnalyticsErrorBoundary,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AnalyticsErrorBoundary>;

// A child renders successfully — the boundary is transparent.
export const Healthy: Story = {
  args: {
    children: <p style={{ padding: '2rem', textAlign: 'center' }}>Everything is fine.</p>,
  },
};

// A child throws on render — the default fallback UI is shown. PostHog capture
// is a no-op here since analytics never initializes in Storybook.
export const ErrorState: Story = {
  args: {
    children: <Boom />,
  },
};

// A custom fallback can replace the default.
export const CustomFallback: Story = {
  args: {
    children: <Boom />,
    fallback: <p style={{ padding: '2rem', textAlign: 'center' }}>Custom fallback content.</p>,
  },
};
