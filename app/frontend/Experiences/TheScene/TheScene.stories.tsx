import type { Meta, StoryObj } from '@storybook/react-vite';

import { BlockKind, TheSceneBlock, TheScenePerformer, TheSceneSuggestion } from '@cctv/types';

import { ExperienceSeeder } from '../../../../.storybook/ExperienceSeeder';
import { lobbyExperience } from '../../../../.storybook/fixtures';
import TheScene from './TheScene';

const performers: TheScenePerformer[] = [
  {
    participant_id: 'p1',
    user_id: 'u1',
    name: 'Maya Carter',
    slug: 'maya-carter',
    photo_url: 'https://i.pravatar.cc/120?img=1',
    has_performer_profile: true,
  },
  {
    participant_id: 'p2',
    user_id: 'u2',
    name: 'Jordan Ali',
    slug: 'jordan-ali',
    photo_url: 'https://i.pravatar.cc/120?img=12',
    has_performer_profile: true,
  },
];

const sampleSuggestions: TheSceneSuggestion[] = [
  { id: 's1', text: 'A wedding on the moon', participant_id: 'p3', vote_count: 5, rank: 1 },
  {
    id: 's2',
    text: 'Dentist appointment gone wrong',
    participant_id: 'p4',
    vote_count: 3,
    rank: 2,
  },
  { id: 's3', text: 'Two raccoons in a trenchcoat', participant_id: 'p5', vote_count: 2, rank: 3 },
  { id: 's4', text: 'First day at a haunted DMV', participant_id: 'p6', vote_count: 1, rank: 4 },
];

function build(overrides: Partial<TheSceneBlock['payload']> = {}): TheSceneBlock {
  return {
    id: 'scene-1',
    kind: BlockKind.THE_SCENE,
    status: 'open',
    position: 0,
    payload: {
      phase: 'collecting',
      scene_started_at: new Date().toISOString(),
      winner_revealed_at: null,
      leaderboard_size: 5,
      prompt_input_count: 3,
      performer_participant_ids: performers.map((p) => p.participant_id),
      prompt_participant_ids: [],
      buzzer_participant_id: null,
      leaderboard: sampleSuggestions,
      performers,
      is_prompt_recipient: false,
      is_buzzer_holder: false,
      is_performer: false,
      ...overrides,
    },
  };
}

const meta: Meta<typeof TheScene> = {
  title: 'Experiences/TheScene',
  component: TheScene,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ExperienceSeeder experience={lobbyExperience}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof TheScene>;

export const ParticipantIdle: Story = {
  args: {
    block: build({ phase: 'idle', leaderboard: [] }),
    viewContext: 'participant',
  },
};

export const ParticipantPromptInput: Story = {
  args: {
    block: build({ is_prompt_recipient: true, leaderboard: [] }),
    viewContext: 'participant',
  },
};

export const ParticipantWaitingForOthers: Story = {
  args: {
    block: build({ leaderboard: [sampleSuggestions[0]] }),
    viewContext: 'participant',
  },
};

export const ParticipantVoting: Story = {
  args: {
    block: build({ leaderboard: sampleSuggestions }),
    viewContext: 'participant',
  },
};

export const ParticipantBuzzerHolderLocked: Story = {
  args: {
    block: build({ is_buzzer_holder: true, leaderboard: [] }),
    viewContext: 'participant',
  },
};

export const ParticipantBuzzerHolderArmed: Story = {
  args: {
    block: build({ is_buzzer_holder: true, leaderboard: sampleSuggestions }),
    viewContext: 'participant',
  },
};

export const ParticipantAsPerformer: Story = {
  args: {
    block: build({ is_performer: true }),
    viewContext: 'participant',
  },
};

export const ParticipantWinnerReveal: Story = {
  args: {
    block: build({
      phase: 'winner_reveal',
      leaderboard: sampleSuggestions,
      winner_revealed_at: new Date().toISOString(),
    }),
    viewContext: 'participant',
  },
};

export const MonitorIdle: Story = {
  args: {
    block: build({ phase: 'idle', leaderboard: [] }),
    viewContext: 'monitor',
  },
};

export const MonitorCollecting: Story = {
  args: {
    block: build({ leaderboard: sampleSuggestions }),
    viewContext: 'monitor',
  },
};

export const MonitorWinnerReveal: Story = {
  args: {
    block: build({
      phase: 'winner_reveal',
      leaderboard: sampleSuggestions,
      winner_revealed_at: new Date().toISOString(),
    }),
    viewContext: 'monitor',
  },
};

export const ManageIdle: Story = {
  args: {
    block: build({ phase: 'idle', leaderboard: [], all_suggestions: [] }),
    viewContext: 'manage',
  },
};

export const ManageCollecting: Story = {
  args: {
    block: build({
      leaderboard: sampleSuggestions,
      all_suggestions: sampleSuggestions,
      prompt_participant_ids: ['p3', 'p4', 'p5'],
      buzzer_participant_id: 'p6',
    }),
    viewContext: 'manage',
  },
};

export const ManageWinnerReveal: Story = {
  args: {
    block: build({
      phase: 'winner_reveal',
      leaderboard: sampleSuggestions,
      all_suggestions: sampleSuggestions,
      winner_revealed_at: new Date().toISOString(),
    }),
    viewContext: 'manage',
  },
};
