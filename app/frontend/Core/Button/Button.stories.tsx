import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Core/Button',
  component: Button,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Click me' },
};

export const Disabled: Story = {
  args: { children: 'Disabled', disabled: true },
};

export const Loading: Story = {
  args: { children: 'Save', loading: true, loadingText: 'Saving...' },
};

export const LoadingNoText: Story = {
  args: { children: 'Submit', loading: true },
};

export const Submit: Story = {
  args: { children: 'Submit', type: 'submit' },
};
