import type { Meta, StoryObj } from '@storybook/react-vite';

import Poll from './Poll';

const meta: Meta<typeof Poll> = {
  title: 'Experiences/Poll',
  component: Poll,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Poll>;

export const SingleChoice: Story = {
  args: {
    question: "What's your favorite color?",
    options: ['Red', 'Blue', 'Green', 'Yellow'],
    pollType: 'single',
    blockId: 'demo-block',
  },
};

export const MultipleChoice: Story = {
  args: {
    question: 'Which genres do you enjoy?',
    options: ['Comedy', 'Drama', 'Action', 'Horror', 'Sci-Fi'],
    pollType: 'multiple',
    blockId: 'demo-block',
  },
};

export const Disabled: Story = {
  args: {
    question: 'Poll is closed',
    options: ['Option A', 'Option B', 'Option C'],
    disabled: true,
    blockId: 'demo-block',
  },
};

export const AlreadyResponded: Story = {
  args: {
    question: "What's your favorite color?",
    options: ['Red', 'Blue', 'Green'],
    blockId: 'demo-block',
    responses: {
      total: 15,
      user_responded: true,
      user_response: { id: 'r1', answer: { selectedOptions: ['Blue'] } },
    },
  },
};

export const MonitorView: Story = {
  args: {
    question: "What's your favorite color?",
    options: ['Red', 'Blue', 'Green'],
    viewContext: 'monitor',
    blockId: 'demo-block',
  },
};
