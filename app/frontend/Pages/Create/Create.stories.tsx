import type { Meta, StoryObj } from '@storybook/react-vite';

import Create from './Create';

const meta: Meta<typeof Create> = {
  title: 'Pages/Create',
  component: Create,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Create>;

export const Default: Story = {};
