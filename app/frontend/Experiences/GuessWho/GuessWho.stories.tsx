import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  BlockKind,
  ExperienceParticipant,
  GuessWhoBlock,
  GuessWhoClue,
  GuessWhoContestant,
} from '@cctv/types';

import { ExperienceSeeder } from '../../../../.storybook/ExperienceSeeder';
import { lobbyExperience, mockParticipants } from '../../../../.storybook/fixtures';
import GuessWhoMonitor from './GuessWhoMonitor';
import GuessWhoParticipant from './GuessWhoParticipant';

const sampleClues: GuessWhoClue[] = [
  {
    id: 'clue1',
    prompt: 'How tall are you?',
    answer: { text: '6\'2"' },
    photo_url: null,
    source_block_id: 'q1',
    block_kind: BlockKind.QUESTION,
    position: 0,
    hidden: false,
  },
  {
    id: 'clue2',
    prompt: 'Favorite ice cream?',
    answer: { text: 'Mint chip' },
    photo_url: null,
    source_block_id: 'q2',
    block_kind: BlockKind.QUESTION,
    position: 1,
    hidden: false,
  },
  {
    id: 'clue3',
    prompt: 'What city were you born in?',
    answer: { text: 'Detroit' },
    photo_url: null,
    source_block_id: 'q3',
    block_kind: BlockKind.QUESTION,
    position: 2,
    hidden: false,
  },
];

const contestant1: GuessWhoContestant = {
  contestant_user_id: 'u1',
  contestant: { user_id: 'u1', name: 'Alice', avatar: mockParticipants[0].avatar },
  mystery_user_id: 'u2',
  mystery: { user_id: 'u2', name: 'Bob', avatar: mockParticipants[1].avatar },
  clues: sampleClues,
  current_clue_index: 0,
  board_candidate_ids: ['u2', 'u3', 'u4'],
  eliminated_user_ids: [],
  unanswered_user_ids: [],
};

const contestant2: GuessWhoContestant = {
  ...contestant1,
  contestant_user_id: 'u3',
  contestant: { user_id: 'u3', name: 'Charlie', avatar: mockParticipants[2].avatar },
  mystery_user_id: 'u4',
  mystery: { user_id: 'u4', name: 'Diana', avatar: mockParticipants[3].avatar },
};

// A 50-strong board: names include some long ones to exercise label wrapping,
// and avatars cycle through the mock fixtures so every cell renders a drawing.
// More than MAX_TILES (32) so the board fills four rows of eight and the final
// tile collapses into an "and N more users…" overflow marker.
const boardNames = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Maximilian Featherstonehaugh',
  'Eve',
  'Frank',
  'Grace',
  'Henrietta-Wilhelmina',
  'Ivan',
  'Jada',
  'Konstantinos Papadopoulos',
  'Lin',
  'Mateo',
  'Nadia',
  'Oluwaseun Adebayo-Johnson',
  'Priya',
  'Quincy',
  'Rosalind',
  'Sven',
  'Tatiana',
  'Umberto',
  'Valentina Rodríguez-García',
  'Wendell',
  'Xiomara',
  'Yusuf',
  'Zara',
  'Bartholomew',
  'Clementine',
  'Desmond',
  'Esmeralda',
  'Fitzgerald',
  'Gwendolyn',
  'Hieronymus',
  'Isadora',
  'Jeremiah',
  'Anastasia Vasilievna Romanova',
  'Lakshmi',
  'Montgomery',
  'Genevieve',
  'Nikolai',
  'Ophelia',
  'Percival',
  'Rosalind-Marie',
  'Sebastián',
  'Theodora',
  'Ulrich',
  'Vivienne',
  'Wolfgang',
  'Ximena',
];

const boardParticipants: ExperienceParticipant[] = boardNames.map((name, i) => {
  const src = mockParticipants[i % mockParticipants.length];
  return {
    ...src,
    id: `bp${i + 1}`,
    user_id: `b${i + 1}`,
    name,
    role: 'player',
  };
});

const bigBoardExperience = {
  ...lobbyExperience,
  hosts: [boardParticipants[0]],
  participants: boardParticipants,
};

const bigBoardContestant: GuessWhoContestant = {
  ...contestant1,
  contestant_user_id: 'b1',
  contestant: { user_id: 'b1', name: boardNames[0], avatar: boardParticipants[0].avatar },
  mystery_user_id: 'b2',
  mystery: { user_id: 'b2', name: boardNames[1], avatar: boardParticipants[1].avatar },
  board_candidate_ids: boardParticipants.map((p) => p.user_id),
  eliminated_user_ids: ['b5', 'b12', 'b23', 'b29'],
  unanswered_user_ids: ['b8', 'b16'],
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

const meta: Meta<typeof GuessWhoMonitor> = {
  title: 'Experiences/GuessWho',
  component: GuessWhoMonitor,
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      const experience = context.parameters.seedExperience ?? lobbyExperience;
      return (
        <ExperienceSeeder experience={experience} monitorView={experience}>
          <Story />
        </ExperienceSeeder>
      );
    },
  ],
};
export default meta;

type Story = StoryObj<typeof GuessWhoMonitor>;

export const MonitorIdle: Story = {
  args: { block: buildBlock({ monitor_view: 'idle' }) },
};

export const MonitorContestant1Clue: Story = {
  args: { block: buildBlock({ monitor_view: 'c1_clue' }) },
};

export const MonitorContestant1Board: Story = {
  args: { block: buildBlock({ monitor_view: 'c1_board' }) },
};

export const MonitorBoardWithEliminations: Story = {
  args: {
    block: buildBlock({
      monitor_view: 'c1_board',
      contestants: [
        { ...contestant1, eliminated_user_ids: ['u3'], unanswered_user_ids: ['u4'] },
        contestant2,
      ],
    }),
  },
};

export const MonitorBoardWithActivePoll: Story = {
  args: {
    block: buildBlock({
      monitor_view: 'c1_board',
      active_poll_block_id: 'poll1',
      active_poll_contestant_index: 0,
      active_poll_response_count: 7,
      active_poll_total_participants: 12,
    }),
  },
};

export const MonitorBoardManyParticipants: Story = {
  parameters: { seedExperience: bigBoardExperience },
  args: {
    block: buildBlock({
      monitor_view: 'c1_board',
      contestants: [bigBoardContestant, contestant2],
    }),
  },
};

export const MonitorContestant2Clue: Story = {
  args: { block: buildBlock({ monitor_view: 'c2_clue' }) },
};

export const MonitorReveal: Story = {
  args: { block: buildBlock({ monitor_view: 'reveal', revealed: true }) },
};

export const MonitorNotStarted: Story = {
  args: { block: buildBlock({ started: false, contestants: [] }) },
};

// Monitor-only: the theme track loops while `theme_music_playing` is true.
// Toggling the control off in the Storybook controls panel pauses it.
export const MonitorThemeMusicPlaying: Story = {
  args: {
    block: {
      ...buildBlock({ monitor_view: 'idle', theme_music_playing: true }),
      sounds: { theme: 'guess_who_theme' },
    },
    viewContext: 'monitor',
  },
};

export const ParticipantWaiting: StoryObj<typeof GuessWhoParticipant> = {
  render: (args) => <GuessWhoParticipant {...args} />,
  args: { block: buildBlock({ active_poll: null, active_poll_block_id: null }) },
};

export const ParticipantActivePoll: StoryObj<typeof GuessWhoParticipant> = {
  render: (args) => <GuessWhoParticipant {...args} />,
  args: {
    block: buildBlock({
      active_poll_block_id: 'poll1',
      active_poll_contestant_index: 0,
      active_poll: {
        id: 'poll1',
        options: ['True', 'False'],
        user_responded: false,
        user_response: null,
      },
    }),
  },
};

export const ParticipantResponded: StoryObj<typeof GuessWhoParticipant> = {
  render: (args) => <GuessWhoParticipant {...args} />,
  args: {
    block: buildBlock({
      active_poll_block_id: 'poll1',
      active_poll: {
        id: 'poll1',
        options: ['True', 'False'],
        user_responded: true,
        user_response: { id: 's1', answer: { selectedOptions: ['True'] } },
      },
    }),
  },
};
