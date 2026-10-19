import type { Meta, StoryObj } from '@storybook/react-vite';

import { TenantProvider } from '@cctv/contexts';

import { TEST_TENANT_CONFIG } from '../test-tenant';
import Home from './home';

const meta: Meta<typeof Home> = {
  title: 'Pages/Home',
  component: Home,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Home>;

export const Default: Story = {};

export const TenantWithoutTagline: Story = {
  decorators: [
    (Story) => (
      <TenantProvider
        config={{
          ...TEST_TENANT_CONFIG,
          features: [],
          theme: { displayName: 'Social Quiztancing', tagline: '', ticketTagline: '' },
        }}
      >
        <Story />
      </TenantProvider>
    ),
  ],
};
