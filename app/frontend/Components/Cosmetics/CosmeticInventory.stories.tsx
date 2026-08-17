import type { Meta, StoryObj } from '@storybook/react-vite';

import { Cosmetic } from '@cctv/types';

import CosmeticInventory from './CosmeticInventory';

const hat: Cosmetic = {
  id: 'hat-1',
  name: 'Top Hat',
  slug: 'top-hat',
  kind: 'hat',
  category: 'clothing',
  asset_key: 'hat',
  default_placement: { x: 100, y: 24, width: 120, height: 96, rotation: 0 },
};

const frame: Cosmetic = {
  id: 'frame-1',
  name: 'Beta Tester',
  slug: 'beta-tester-frame',
  kind: 'frame',
  category: 'frame',
  asset_key: 'beta_tester_frame',
  default_placement: { x: 0, y: 0, width: 320, height: 320, rotation: 0 },
};

const meta: Meta<typeof CosmeticInventory> = {
  title: 'Components/CosmeticInventory',
  component: CosmeticInventory,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Shows the cosmetics a participant owns; each can be dragged onto the avatar canvas or clicked/tapped to apply.\n\n' +
          '**Manual testing:** admin and superadmin accounts bypass the avatar drawing screen, so use the seeded non-admin user `cosmetics_test_user@gmail.com` (role `user`) to reach it. That account owns every active cosmetic. Run `bin/rails db:seed` to (re)create it.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof CosmeticInventory>;

export const WithCosmetics: Story = {
  args: {
    cosmetics: [hat, frame],
    onApply: (c) => console.log('apply', c.slug),
    onClearFrame: () => console.log('clear frame'),
  },
};

export const Empty: Story = {
  args: {
    cosmetics: [],
  },
};

export const Loading: Story = {
  args: {
    cosmetics: [],
    isLoading: true,
  },
};

export const Error: Story = {
  args: {
    cosmetics: [],
    error: 'Failed to load cosmetics',
  },
};
