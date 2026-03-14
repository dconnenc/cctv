import type { Meta, StoryObj } from '@storybook/react-vite';

import Question from './Question';

const meta: Meta<typeof Question> = {
  title: 'Experiences/Question',
  component: Question,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Question>;

export const TextInput: Story = {
  args: {
    question: "What's your name?",
    formKey: 'name',
    inputType: 'text',
    blockId: 'demo-block',
  },
};

export const NumberInput: Story = {
  args: {
    question: 'How old are you?',
    formKey: 'age',
    inputType: 'number',
    blockId: 'demo-block',
  },
};

export const CustomButtonText: Story = {
  args: {
    question: 'Enter your guess',
    formKey: 'guess',
    buttonText: 'Lock it in!',
    blockId: 'demo-block',
  },
};

export const Disabled: Story = {
  args: {
    question: 'This question is closed',
    formKey: 'answer',
    disabled: true,
    blockId: 'demo-block',
  },
};

export const AlreadyResponded: Story = {
  args: {
    question: "What's your name?",
    formKey: 'name',
    blockId: 'demo-block',
    responses: {
      total: 10,
      user_responded: true,
      user_response: { id: 'r1', answer: { value: 'Alice' } },
    },
  },
};

export const MonitorView: Story = {
  args: {
    question: "What's your name?",
    formKey: 'name',
    viewContext: 'monitor',
    blockId: 'demo-block',
  },
};
