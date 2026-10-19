import type { Meta, StoryObj } from '@storybook/react-vite';

import { TenantProvider, ThemeProvider } from '@cctv/contexts';

import { TEST_TENANT_CONFIG } from '../../test-tenant';
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
      <TenantProvider config={{ ...TEST_TENANT_CONFIG, features: [] }}>
        <Story />
      </TenantProvider>
    ),
  ],
};
