import type { Meta, StoryObj } from '@storybook/react-vite';

import { Dropdown } from './Dropdown';

const meta: Meta<typeof Dropdown> = {
  title: 'Core/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
  args: {
    label: 'Role',
    options: [
      { label: 'Player', value: 'player' },
      { label: 'Audience', value: 'audience' },
      { label: 'Host', value: 'host' },
      { label: 'Moderator', value: 'moderator' },
    ],
    onChange: (value: string) => console.log('Selected:', value),
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};
