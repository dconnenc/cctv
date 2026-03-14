import type { Meta, StoryObj } from '@storybook/react-vite';

import { Pill } from './Pill';

const meta: Meta<typeof Pill> = {
  title: 'Core/Pill',
  component: Pill,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Pill>;

export const Default: Story = {
  args: { label: 'Live' },
};

export const Multiple: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Pill label="Draft" />
      <Pill label="Lobby" />
      <Pill label="Live" />
      <Pill label="Paused" />
      <Pill label="Finished" />
    </div>
  ),
};
