import type { Meta, StoryObj } from '@storybook/react-vite';

import NewsletterSignup from './NewsletterSignup';

const meta: Meta<typeof NewsletterSignup> = {
  title: 'Experiences/NewsletterSignup',
  component: NewsletterSignup,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof NewsletterSignup>;

export const Default: Story = {
  args: {
    blockId: 'demo-block',
  },
};

export const CustomPrompt: Story = {
  args: {
    prompt: 'Want the good stuff in your inbox?',
    blockId: 'demo-block',
  },
};

export const Disabled: Story = {
  args: {
    prompt: 'Signup is closed',
    disabled: true,
    blockId: 'demo-block',
  },
};

export const MonitorView: Story = {
  args: {
    prompt: 'Can we add you to our mailing list?',
    viewContext: 'monitor',
    blockId: 'demo-block',
  },
};
