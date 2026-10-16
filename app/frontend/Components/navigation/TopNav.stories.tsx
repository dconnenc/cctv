import type { Meta, StoryObj } from '@storybook/react-vite';

import { DEFAULT_TENANT_CONFIG, TenantProvider } from '@cctv/contexts/TenantContext';
import { ThemeProvider } from '@cctv/contexts/ThemeContext';

import { TopNav } from './TopNav';

const meta: Meta<typeof TopNav> = {
  title: 'Components/TopNav',
  component: TopNav,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof TopNav>;

export const AllFeatures: Story = {};

export const NoPublicFeatures: Story = {
  decorators: [
    (Story) => (
      <TenantProvider config={{ ...DEFAULT_TENANT_CONFIG, features: [] }}>
        <Story />
      </TenantProvider>
    ),
  ],
};
