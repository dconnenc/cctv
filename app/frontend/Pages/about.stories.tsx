import type { Meta, StoryObj } from '@storybook/react-vite';

import About from './about';

const meta: Meta<typeof About> = {
  title: 'Pages/About',
  component: About,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof About>;

export const Default: Story = {};
