import type { Meta, StoryObj } from '@storybook/react-vite';

import { SegmentBadge } from './SegmentBadge';

const meta: Meta<typeof SegmentBadge> = {
  title: 'Core/SegmentBadge',
  component: SegmentBadge,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof SegmentBadge>;

export const Default: Story = {
  args: { name: 'Team Alpha', color: '#3300ff' },
};

export const Removable: Story = {
  args: {
    name: 'Team Beta',
    color: '#ff00f5',
    onRemove: () => console.log('Removed'),
  },
};

export const Multiple: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <SegmentBadge name="Red Team" color="#ff4911" />
      <SegmentBadge name="Blue Team" color="#3300ff" />
      <SegmentBadge name="Green Team" color="#2fff2f" />
      <SegmentBadge name="Pink Team" color="#ff00f5" />
    </div>
  ),
};
