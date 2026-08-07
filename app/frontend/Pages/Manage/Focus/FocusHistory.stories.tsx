import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';

import { Block, BlockKind } from '@cctv/types';

import FocusHistory from './FocusHistory';

function past(id: string, kind: BlockKind, question: string, total: number): Block {
  return {
    id,
    kind,
    status: 'closed',
    position: 0,
    payload: { question },
    responses: { total },
  } as Block;
}

const meta: Meta<typeof FocusHistory> = {
  title: 'Manage/Focus/FocusHistory',
  component: FocusHistory,
  tags: ['autodocs'],
  args: {
    onSelect: fn(),
    blocks: [
      past('b3', BlockKind.FAMILY_FEUD, 'Name something you find in a green room', 41),
      past('b2', BlockKind.POLL, 'Which sketch should close the show?', 24),
      past('b1', BlockKind.QUESTION, 'What is the worst advice you have been given?', 8),
    ],
  },
};
export default meta;

type Story = StoryObj<typeof FocusHistory>;

export const WithPastActivities: Story = {};

export const SingleResponse: Story = {
  args: {
    blocks: [past('b1', BlockKind.BUZZER, 'First to buzz wins', 1)],
  },
};

export const Empty: Story = {
  args: { blocks: [] },
};
