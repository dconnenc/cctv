import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';

import { buzzerBlock, familyFeudBlock, pollBlock, questionBlock } from '../testFactories';
import FocusHistory from './FocusHistory';

const meta: Meta<typeof FocusHistory> = {
  title: 'Manage/Focus/FocusHistory',
  component: FocusHistory,
  tags: ['autodocs'],
  args: {
    onSelect: fn(),
    blocks: [
      familyFeudBlock({
        id: 'b3',
        status: 'closed',
        payload: { title: 'Name something you find in a green room' },
        responses: { total: 41 },
      }),
      pollBlock({
        id: 'b2',
        status: 'closed',
        payload: { question: 'Which sketch should close the show?', options: [] },
        responses: { total: 24 },
      }),
      questionBlock({
        id: 'b1',
        status: 'closed',
        payload: { question: 'What is the worst advice you have been given?', formKey: 'advice' },
        responses: { total: 8 },
      }),
    ],
  },
};
export default meta;

type Story = StoryObj<typeof FocusHistory>;

export const WithPastActivities: Story = {};

export const SingleResponse: Story = {
  args: {
    blocks: [
      buzzerBlock({
        id: 'b1',
        status: 'closed',
        payload: { prompt: 'First to buzz wins' },
        responses: { total: 1 },
      }),
    ],
  },
};

export const Empty: Story = {
  args: { blocks: [] },
};
