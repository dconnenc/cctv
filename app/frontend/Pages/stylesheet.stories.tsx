import type { Meta, StoryObj } from '@storybook/react-vite';

import Stylesheet from './stylesheet';

const meta: Meta<typeof Stylesheet> = {
  title: 'Pages/Stylesheet',
  component: Stylesheet,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Stylesheet>;

export const Default: Story = {};
