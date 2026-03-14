import type { Meta, StoryObj } from '@storybook/react-vite';

import { TextInput } from './TextInput';

const meta: Meta<typeof TextInput> = {
  title: 'Core/TextInput',
  component: TextInput,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof TextInput>;

export const Default: Story = {
  args: { placeholder: 'Enter text...' },
};

export const WithLabel: Story = {
  args: { label: 'Your name', placeholder: 'Jane Doe' },
};

export const Disabled: Story = {
  args: { label: 'Email', placeholder: 'you@example.com', disabled: true },
};

export const Password: Story = {
  args: { label: 'Password', type: 'password', placeholder: '••••••••' },
};

export const Number: Story = {
  args: { label: 'Age', type: 'number', placeholder: '25' },
};
