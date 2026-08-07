import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';

import { pollBlock } from '../testFactories';
import FocusStage from './FocusStage';

const livePoll = pollBlock({
  status: 'open',
  payload: {
    question: 'Which sketch should close the show?',
    options: ['The Bit', 'Cold Open', 'Musical Number'],
  },
  responses: { total: 0 },
});

const meta: Meta<typeof FocusStage> = {
  title: 'Manage/Focus/FocusStage',
  component: FocusStage,
  tags: ['autodocs'],
  args: {
    onFinish: fn(),
    isFinishing: false,
    block: livePoll,
  },
};
export default meta;

type Story = StoryObj<typeof FocusStage>;

export const AwaitingResponses: Story = {};

export const WithResponses: Story = {
  args: {
    block: { ...livePoll, responses: { total: 24 } },
  },
};

export const Finishing: Story = {
  args: { isFinishing: true },
};
