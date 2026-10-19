import type { Meta, StoryObj } from '@storybook/react-vite';

import { TenantProvider } from '@cctv/contexts';

import { TEST_TENANT_CONFIG } from '../test-tenant';
import About from './about';

const meta: Meta<typeof About> = {
  title: 'Pages/About',
  component: About,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof About>;

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
