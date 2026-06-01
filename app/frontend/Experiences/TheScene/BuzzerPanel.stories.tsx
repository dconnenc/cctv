import type { Meta, StoryObj } from '@storybook/react-vite';

import { BuzzerPanel } from './BuzzerPanel';

const meta: Meta<typeof BuzzerPanel> = {
  title: 'Experiences/TheScene/BuzzerPanel',
  component: BuzzerPanel,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--deep)', padding: '1rem', minHeight: 480 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof BuzzerPanel>;

export const LockedWaiting: Story = {
  args: { blockId: 'demo', activeSuggestionCount: 0 },
};

export const LockedOneSuggestion: Story = {
  args: { blockId: 'demo', activeSuggestionCount: 1 },
};

export const Armed: Story = {
  args: { blockId: 'demo', activeSuggestionCount: 3 },
};
