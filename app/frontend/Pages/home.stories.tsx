import type { Meta, StoryObj } from '@storybook/react-vite';

import Home from './home';

const meta: Meta<typeof Home> = {
  title: 'Pages/Home',
  component: Home,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Home>;

export const Default: Story = {};
