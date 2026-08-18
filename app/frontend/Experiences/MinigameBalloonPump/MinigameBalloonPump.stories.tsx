import { useEffect } from 'react';

import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { useExperienceState } from '@cctv/contexts/ExperienceStateContext';
import { BlockKind, MinigameBalloonPumpBlock, MinigameBalloonPumpPodiumEntry } from '@cctv/types';

import { ExperienceSeeder } from '../../../../.storybook/ExperienceSeeder';
import {
  lobbyExperience,
  mockParticipant,
  mockParticipants,
} from '../../../../.storybook/fixtures';
import MinigameBalloonPump from './MinigameBalloonPump';

const BLOCK_ID = 'balloon-1';
const TARGET = 50;

const podium: MinigameBalloonPumpPodiumEntry[] = [
  {
    place: 1,
    participant_id: 'p1',
    name: 'Alice',
    avatar: mockParticipants[0].avatar,
    fill_amount: TARGET,
  },
  {
    place: 2,
    participant_id: 'p2',
    name: 'Bob',
    avatar: mockParticipants[1].avatar,
    fill_amount: 46,
  },
  {
    place: 3,
    participant_id: 'p3',
    name: 'Charlie',
    avatar: mockParticipants[2].avatar,
    fill_amount: 39,
  },
];

function build(
  overrides: Partial<MinigameBalloonPumpBlock['payload']> = {},
): MinigameBalloonPumpBlock {
  return {
    id: BLOCK_ID,
    kind: BlockKind.MINIGAME_BALLOON_PUMP,
    status: 'open',
    position: 0,
    payload: {
      variant: 'balloon_pump',
      target_units: TARGET,
      started_at: new Date().toISOString(),
      ended_at: null,
      winner_participant_ids: [],
      ...overrides,
    },
  };
}

// Seeds this participant's own fill, which the balloon view reads from
// ExperienceStateContext (normally pushed over the websocket on subscribe).
function FillSeeder({ fill }: { fill: number }) {
  const { setSubmissionState } = useExperienceState();
  useEffect(() => {
    setSubmissionState((prev) => ({ ...prev, [BLOCK_ID]: { fill_amount: fill } }));
  }, [fill, setSubmissionState]);
  return null;
}

function withFill(fill: number): Decorator {
  return (Story) => (
    <>
      <FillSeeder fill={fill} />
      <Story />
    </>
  );
}

const meta: Meta<typeof MinigameBalloonPump> = {
  title: 'Experiences/MinigameBalloonPump',
  component: MinigameBalloonPump,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ExperienceSeeder
        experience={lobbyExperience}
        participant={mockParticipant}
        monitorView={lobbyExperience}
      >
        <Story />
      </ExperienceSeeder>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof MinigameBalloonPump>;

export const ParticipantWaiting: Story = {
  args: {
    block: build({ started_at: null }),
    viewContext: 'participant',
  },
};

export const ParticipantPumping: Story = {
  decorators: [withFill(30)],
  args: {
    block: build({ leader_fill: 35 }),
    viewContext: 'participant',
  },
};

export const ParticipantNearBurst: Story = {
  decorators: [withFill(TARGET - 1)],
  args: {
    block: build({ leader_fill: TARGET - 1 }),
    viewContext: 'participant',
  },
};

export const ParticipantBurstWinner: Story = {
  decorators: [withFill(TARGET)],
  args: {
    block: build({
      ended_at: new Date().toISOString(),
      leader_fill: TARGET,
      winner_participant_ids: [mockParticipant.id],
      podium,
    }),
    viewContext: 'participant',
  },
};

export const ParticipantGameOver: Story = {
  decorators: [withFill(22)],
  args: {
    block: build({
      ended_at: new Date().toISOString(),
      leader_fill: TARGET,
      winner_participant_ids: ['p1'],
      podium,
    }),
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
    block: build(),
    viewContext: 'monitor',
  },
};

export const MonitorPodium: Story = {
  args: {
    block: build({
      ended_at: new Date().toISOString(),
      leader_fill: TARGET,
      winner_participant_ids: ['p1'],
      podium,
    }),
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
    block: build({
      ended_at: new Date().toISOString(),
      leader_fill: TARGET,
      winner_participant_ids: ['p1'],
      podium,
    }),
    viewContext: 'manage',
  },
};
