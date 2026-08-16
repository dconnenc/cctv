import type { Meta, StoryObj } from '@storybook/react-vite';

import { BlockKind, GuessWhoBlock, GuessWhoClue, GuessWhoContestant } from '@cctv/types';

import { ExperienceSeeder } from '../../../../../.storybook/ExperienceSeeder';
import { lobbyExperience, mockParticipants } from '../../../../../.storybook/fixtures';
import GuessWhoManager from './GuessWhoManager';

function buildClues(idPrefix: string): GuessWhoClue[] {
  return [
    {
      id: `${idPrefix}-clue1`,
      prompt: 'How tall are you?',
      answer: { text: '6\'2"' },
      photo_url: null,
      source_block_id: 'q1',
      block_kind: BlockKind.QUESTION,
      position: 0,
      hidden: false,
    },
    {
      id: `${idPrefix}-clue2`,
      prompt: 'Favorite ice cream?',
      answer: { text: 'Mint chip' },
      photo_url: null,
      source_block_id: 'q2',
      block_kind: BlockKind.QUESTION,
      position: 1,
      hidden: false,
    },
    {
      id: `${idPrefix}-clue3`,
      prompt: 'What city were you born in?',
      answer: { text: 'Detroit' },
      photo_url: null,
      source_block_id: 'q3',
      block_kind: BlockKind.QUESTION,
      position: 2,
      hidden: true,
    },
  ];
}

const contestant1: GuessWhoContestant = {
  contestant_user_id: 'u1',
  contestant: { user_id: 'u1', name: 'Alice', avatar: mockParticipants[0].avatar },
  mystery_user_id: 'u2',
  mystery: { user_id: 'u2', name: 'Bob', avatar: mockParticipants[1].avatar },
  clues: buildClues('c1'),
  current_clue_index: 1,
  board_candidate_ids: ['u2', 'u3', 'u4'],
  eliminated_user_ids: ['u3'],
  unanswered_user_ids: [],
};

const contestant2: GuessWhoContestant = {
  ...contestant1,
  contestant_user_id: 'u3',
  contestant: { user_id: 'u3', name: 'Charlie', avatar: mockParticipants[2].avatar },
  mystery_user_id: 'u4',
  mystery: { user_id: 'u4', name: 'Diana', avatar: mockParticipants[3].avatar },
  clues: buildClues('c2'),
  current_clue_index: 0,
  eliminated_user_ids: [],
  unanswered_user_ids: ['u2'],
};

const seededExperience = {
  ...lobbyExperience,
  segments: [
    ...(lobbyExperience.segments ?? []),
    { id: 'seg-contestants', name: 'Guess Who Contestants', color: '#F59E0B', position: 99 },
  ],
  participants: lobbyExperience.participants.map((p, i) =>
    i < 2 ? { ...p, segments: [...(p.segments ?? []), 'Guess Who Contestants'] } : p,
  ),
};

function buildBlock(overrides: Partial<GuessWhoBlock['payload']> = {}): GuessWhoBlock {
  return {
    id: 'gw1',
    kind: BlockKind.GUESS_WHO,
    status: 'open',
    position: 0,
    payload: {
      contestant_segment_id: 'seg-contestants',
      eligibility_threshold: 0.1,
      started: true,
      revealed: false,
      monitor_view: 'idle',
      contestants: [contestant1, contestant2],
      active_poll_block_id: null,
      active_poll_contestant_index: null,
      ...overrides,
    },
  };
}

const meta: Meta<typeof GuessWhoManager> = {
  title: 'Pages/Block/GuessWhoManager',
  component: GuessWhoManager,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ExperienceSeeder experience={seededExperience}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof GuessWhoManager>;

export const NotStartedNoContestants: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder experience={lobbyExperience}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
  args: {
    block: buildBlock({ started: false, contestants: [] }),
  },
};

export const NotStartedWithContestants: Story = {
  args: {
    block: buildBlock({ started: false, contestants: [] }),
  },
};

export const InProgressIdle: Story = {
  args: {
    block: buildBlock({ monitor_view: 'idle' }),
  },
};

export const InProgressC1Board: Story = {
  args: {
    block: buildBlock({ monitor_view: 'c1_board' }),
  },
};

export const ActivePoll: Story = {
  args: {
    block: buildBlock({
      monitor_view: 'c1_board',
      active_poll_block_id: 'poll1',
      active_poll_contestant_index: 0,
      active_poll_response_count: 5,
      active_poll_total_participants: 12,
    }),
  },
};

export const Revealed: Story = {
  args: {
    block: buildBlock({ monitor_view: 'reveal', revealed: true }),
  },
};
