import type { Meta, StoryObj } from '@storybook/react-vite';

import MadLib from './MadLib';

const meta: Meta<typeof MadLib> = {
  title: 'Experiences/MadLib',
  component: MadLib,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof MadLib>;

export const WithBlanks: Story = {
  args: {
    parts: [
      { id: '1', type: 'text', content: 'The ' },
      { id: '2', type: 'variable', content: 'adjective' },
      { id: '3', type: 'text', content: ' fox jumped over the ' },
      { id: '4', type: 'variable', content: 'noun' },
      { id: '5', type: 'text', content: '.' },
    ],
  },
};

export const Resolved: Story = {
  args: {
    parts: [
      { id: '1', type: 'text', content: 'The ' },
      { id: '2', type: 'variable', content: 'adjective' },
      { id: '3', type: 'text', content: ' fox jumped over the ' },
      { id: '4', type: 'variable', content: 'noun' },
      { id: '5', type: 'text', content: '.' },
    ],
    responses: {
      total: 5,
      user_responded: true,
      user_response: null,
      resolved_variables: {
        adjective: 'sneaky',
        noun: 'lazy dog',
      },
    },
  },
};

export const PartiallyResolved: Story = {
  args: {
    parts: [
      { id: '1', type: 'text', content: 'I want to ' },
      { id: '2', type: 'variable', content: 'verb' },
      { id: '3', type: 'text', content: ' a ' },
      { id: '4', type: 'variable', content: 'noun' },
      { id: '5', type: 'text', content: ' in the ' },
      { id: '6', type: 'variable', content: 'place' },
      { id: '7', type: 'text', content: '.' },
    ],
    responses: {
      total: 3,
      user_responded: true,
      user_response: null,
      resolved_variables: {
        verb: 'build',
      },
    },
  },
};
