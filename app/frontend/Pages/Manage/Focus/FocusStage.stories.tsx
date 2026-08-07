import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';

import { Block, BlockKind } from '@cctv/types';

import FocusStage from './FocusStage';

const pollBlock = {
  id: 'block-1',
  kind: BlockKind.POLL,
  status: 'open',
  position: 0,
  payload: {
    question: 'Which sketch should close the show?',
    options: ['The Bit', 'Cold Open', 'Musical Number'],
  },
  responses: { total: 0 },
} as Block;

const meta: Meta<typeof FocusStage> = {
  title: 'Manage/Focus/FocusStage',
  component: FocusStage,
  tags: ['autodocs'],
  args: {
    onFinish: fn(),
    isFinishing: false,
    block: pollBlock,
  },
};
export default meta;

type Story = StoryObj<typeof FocusStage>;

export const AwaitingResponses: Story = {};

export const WithResponses: Story = {
  args: {
    block: { ...pollBlock, responses: { total: 24 } } as Block,
  },
};

export const Finishing: Story = {
  args: { isFinishing: true },
};
