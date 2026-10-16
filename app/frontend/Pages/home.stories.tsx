import type { Meta, StoryObj } from '@storybook/react-vite';

import { DEFAULT_TENANT_CONFIG, TenantProvider } from '@cctv/contexts';

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
          ...DEFAULT_TENANT_CONFIG,
          features: [],
          theme: { displayName: 'Social Quiztancing', tagline: '', ticketTagline: '' },
        }}
      >
        <Story />
      </TenantProvider>
    ),
  ],
};
