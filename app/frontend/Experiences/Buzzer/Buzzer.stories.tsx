import type { Meta, StoryObj } from '@storybook/react-vite';

import { BlockKind, BlockStatus, BuzzerBlock } from '@cctv/types';

import Buzzer from './Buzzer';

const baseBuzzerBlock: BuzzerBlock = {
  id: 'buzzer-1',
  kind: BlockKind.BUZZER,
  status: 'open' as BlockStatus,
  position: 0,
  payload: {
    prompt: 'Contestants be ready to buzz in!',
    label: 'Buzz In',
  },
};

const meta: Meta<typeof Buzzer> = {
  title: 'Experiences/Buzzer',
  component: Buzzer,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Buzzer>;

export const ParticipantReady: Story = {
  args: {
    block: baseBuzzerBlock,
    viewContext: 'participant',
  },
};

export const ParticipantBuzzed: Story = {
  args: {
    block: {
      ...baseBuzzerBlock,
      responses: {
        total: 1,
        user_responded: true,
        user_response: {
          id: 'r1',
          answer: { buzzed_at: new Date().toISOString() },
        },
      },
    },
    viewContext: 'participant',
  },
};

export const MonitorWaiting: Story = {
  args: {
    block: baseBuzzerBlock,
    viewContext: 'monitor',
  },
};

export const MonitorWithWinner: Story = {
  args: {
    block: {
      ...baseBuzzerBlock,
      responses: {
        total: 3,
        user_responded: false,
        all_responses: [
          {
            id: 'r1',
            user_id: 'u1',
            answer: { buzzed_at: new Date().toISOString() },
            created_at: new Date().toISOString(),
          },
          {
            id: 'r2',
            user_id: 'u2',
            answer: { buzzed_at: new Date(Date.now() + 500).toISOString() },
            created_at: new Date(Date.now() + 500).toISOString(),
          },
          {
            id: 'r3',
            user_id: 'u3',
            answer: { buzzed_at: new Date(Date.now() + 1200).toISOString() },
            created_at: new Date(Date.now() + 1200).toISOString(),
          },
        ],
      },
    },
    viewContext: 'monitor',
  },
};

export const CustomPrompt: Story = {
  args: {
    block: {
      ...baseBuzzerBlock,
      payload: {
        prompt: 'Who knows the answer? Hit the buzzer!',
        label: 'SMASH IT',
      },
    },
    viewContext: 'participant',
  },
};
