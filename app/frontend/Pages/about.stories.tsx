import type { Meta, StoryObj } from '@storybook/react-vite';

import { DEFAULT_TENANT_CONFIG, TenantProvider } from '@cctv/contexts';

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
