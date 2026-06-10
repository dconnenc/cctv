import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  BlockKind,
  MinigameArithmeticBlock,
  MinigameArithmeticLeaderboardEntry,
  MinigameArithmeticQuestion,
} from '@cctv/types';

import { ExperienceSeeder } from '../../../../.storybook/ExperienceSeeder';
import {
  lobbyExperience,
  mockParticipant,
  mockParticipants,
} from '../../../../.storybook/fixtures';
import MinigameArithmetic from './MinigameArithmetic';

const BLOCK_ID = 'arith-1';
const DURATION = 60;

const questions: MinigameArithmeticQuestion[] = [
  { index: 0, lhs: 7, op: '+', rhs: 5, answer: 12, prompt: '7 + 5' },
  { index: 1, lhs: 9, op: '*', rhs: 3, answer: 27, prompt: '9 × 3' },
  { index: 2, lhs: 18, op: '-', rhs: 6, answer: 12, prompt: '18 − 6' },
  { index: 3, lhs: 24, op: '/', rhs: 4, answer: 6, prompt: '24 ÷ 4' },
];

const leaderboard: MinigameArithmeticLeaderboardEntry[] = [
  {
    participant_id: 'p1',
    user_id: 'u1',
    name: 'Alice',
    avatar: mockParticipants[0].avatar,
    correct: 8,
    completed: 9,
    rank: 1,
  },
  {
    participant_id: 'p2',
    user_id: 'u2',
    name: 'Bob',
    avatar: mockParticipants[1].avatar,
    correct: 6,
    completed: 8,
    rank: 2,
  },
  {
    participant_id: 'p3',
    user_id: 'u3',
    name: 'Charlie',
    avatar: mockParticipants[2].avatar,
    correct: 5,
    completed: 7,
    rank: 3,
  },
];

function build(
  overrides: Partial<MinigameArithmeticBlock['payload']> = {},
): MinigameArithmeticBlock {
  return {
    id: BLOCK_ID,
    kind: BlockKind.MINIGAME_ARITHMETIC,
    status: 'open',
    position: 0,
    payload: {
      variant: 'arithmetic',
      duration_seconds: DURATION,
      question_count: questions.length,
      leaderboard_size: 5,
      started_at: new Date().toISOString(),
      ended_at: null,
      questions,
      ...overrides,
    },
    responses: { total: 14, correct_count: 9, participant_counts: { p1: 9, p2: 8, p3: 7 } },
  };
}
const meta: Meta<typeof MinigameArithmetic> = {
  title: 'Experiences/MinigameArithmetic',
  component: MinigameArithmetic,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ExperienceSeeder experience={lobbyExperience} participant={mockParticipant}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof MinigameArithmetic>;

export const ParticipantGetReady: Story = {
  args: {
    block: build({ started_at: null }),
    viewContext: 'participant',
  },
};

export const ParticipantPlaying: Story = {
  args: {
    block: build(),
    viewContext: 'participant',
  },
};

export const ParticipantEnded: Story = {
  args: {
    block: build({ ended_at: new Date().toISOString(), leaderboard }),
    viewContext: 'participant',
  },
};

export const MonitorGetReady: Story = {
  args: {
    block: build({ started_at: null }),
    viewContext: 'monitor',
  },
};

export const MonitorRunning: Story = {
  args: {
    block: build({ submission_count: 23 }),
    viewContext: 'monitor',
  },
};

export const MonitorLeaderboard: Story = {
  args: {
    block: build({ ended_at: new Date().toISOString(), leaderboard }),
    viewContext: 'monitor',
  },
};

export const ManageQueued: Story = {
  args: {
    block: build({ started_at: null }),
    viewContext: 'manage',
  },
};

export const ManageRunning: Story = {
  args: {
    block: build(),
    viewContext: 'manage',
  },
};

export const ManageEnded: Story = {
  args: {
    block: build({ ended_at: new Date().toISOString(), leaderboard }),
    viewContext: 'manage',
  },
};
