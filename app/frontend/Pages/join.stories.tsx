import type { Meta, StoryObj } from '@storybook/react-vite';

import Join from './join';

const meta: Meta<typeof Join> = {
  title: 'Pages/Join',
  component: Join,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Join>;

export const Default: Story = {};
