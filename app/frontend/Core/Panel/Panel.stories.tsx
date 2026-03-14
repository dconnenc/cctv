import type { Meta, StoryObj } from '@storybook/react-vite';

import { Panel } from './Panel';

const meta: Meta<typeof Panel> = {
  title: 'Core/Panel',
  component: Panel,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Panel>;

export const Default: Story = {
  args: {
    title: 'Participants',
    children: 'Panel content goes here',
  },
};

export const WithHeaderContent: Story = {
  args: {
    title: 'Players',
    headerContent: <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>12 online</span>,
    children: 'List of players would appear here',
  },
};

export const NoTitle: Story = {
  args: {
    children: 'A panel without a title or header',
  },
};
