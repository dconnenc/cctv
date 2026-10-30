import { useEffect } from 'react';

import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { useDispatchRegistry } from '@cctv/contexts/DispatchRegistryContext';
import {
  BlockKind,
  MinigameFishyBlock,
  MinigameFishyElimination,
  MinigameFishyFrameMessage,
  MinigameFishyPlayerFrame,
} from '@cctv/types';

import { ExperienceSeeder } from '../../../../.storybook/ExperienceSeeder';
import {
  lobbyExperience,
  mockParticipant,
  mockParticipants,
} from '../../../../.storybook/fixtures';
import MinigameFishy from './MinigameFishy';
import { FISHY } from './fishyMath';

const BLOCK_ID = 'fishy-1';
const ROSTER = mockParticipants.map((p) => p.id);
const PAST_START = new Date(Date.now() - 1000).toISOString();

function build(overrides: Partial<MinigameFishyBlock['payload']> = {}): MinigameFishyBlock {
  return {
    id: BLOCK_ID,
    kind: BlockKind.MINIGAME_FISHY,
    status: 'open',
    position: 0,
    payload: {
      title: 'Fishy',
      instructions: 'Touch to swim. Double-tap to dash. Eat smaller fish — last one swimming wins.',
      max_players: 50,
      started_at: PAST_START,
      ended_at: null,
      roster: ROSTER,
      world_size: 4000,
      ...overrides,
    },
  };
}

type Script = (seconds: number) => {
  players: MinigameFishyPlayerFrame[];
  eliminated?: MinigameFishyElimination[];
};

// Players orbit the middle of the bowl at different radii and speeds.
const orbiting =
  (worldSize: number, eatenAfterSeconds?: number): Script =>
  (seconds) => {
    const center = worldSize / 2;
    const players = ROSTER.map((_, slot): MinigameFishyPlayerFrame => {
      const orbit = 120 + slot * 90;
      const angle = seconds * (0.4 + slot * 0.15) + slot;
      const size = 1 + slot * 0.12;
      return [slot, center + Math.cos(angle) * orbit, center + Math.sin(angle) * orbit, size, 0];
    });
    if (eatenAfterSeconds === undefined || seconds < eatenAfterSeconds) return { players };
    return { players: players.filter(([slot]) => slot !== 1) };
  };

// Idle, moving, and dashing side by side for tuning the wiggle by eye.
const wiggleLineup: Script = (seconds) => {
  const sweep = Math.sin(seconds * 1.5) * 90;
  const dashSweep = Math.sin(seconds * 4) * 120;
  return {
    players: [
      [0, 150, 300, 1.2, 0],
      [1, 300 + sweep, 300, 1.2, 0],
      [2, 450 + dashSweep * 0.3, 300 + dashSweep, 1.2, 1],
    ],
  };
};

function FrameFeeder({
  script,
  startedAt,
  eatenAfterSeconds,
}: {
  script: Script;
  startedAt: string;
  eatenAfterSeconds?: number;
}) {
  const { dispatchFishyFrame } = useDispatchRegistry();

  useEffect(() => {
    const origin = performance.now();
    const pelletField = Array.from({ length: 160 }, (_, i): [number, number] => [
      ((i * 977) % 3900) + 50,
      ((i * 613) % 3900) + 50,
    ]);
    let t = 0;
    let eatenSent = false;

    const send = (keyframe: boolean) => {
      t += 1;
      const seconds = (performance.now() - origin) / 1000;
      const { players } = script(seconds);
      const eliminated: MinigameFishyElimination[] = [];
      if (eatenAfterSeconds !== undefined && seconds >= eatenAfterSeconds && !eatenSent) {
        eatenSent = true;
        eliminated.push([1, 0]);
      }
      const frame: MinigameFishyFrameMessage = {
        type: 'minigame_fishy_frame',
        block_id: BLOCK_ID,
        started_at: startedAt,
        t,
        players,
        eliminated,
        pellets: [],
      };
      if (keyframe) {
        frame.keyframe = true;
        frame.pellet_field = pelletField;
        frame.out = eatenSent ? [[1, 0]] : [];
      }
      dispatchFishyFrame(frame);
    };

    send(true);
    const id = window.setInterval(() => send(t % 75 === 0), FISHY.tickMs);
    return () => window.clearInterval(id);
  }, [dispatchFishyFrame, script, startedAt, eatenAfterSeconds]);

  return null;
}

function withFrames(script: Script, startedAt = PAST_START, eatenAfterSeconds?: number): Decorator {
  return (Story) => (
    <>
      <FrameFeeder script={script} startedAt={startedAt} eatenAfterSeconds={eatenAfterSeconds} />
      <Story />
    </>
  );
}

const meta: Meta<typeof MinigameFishy> = {
  title: 'Experiences/MinigameFishy',
  component: MinigameFishy,
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

type Story = StoryObj<typeof MinigameFishy>;

const standings = ROSTER.map((participant_id, index) => ({
  participant_id,
  place: index + 1,
  size: 2.4 - index * 0.4,
}));

const countdownStart = new Date(Date.now() + 60_000).toISOString();

export const ParticipantWaiting: Story = {
  args: { block: build({ started_at: null, roster: [] }), viewContext: 'participant' },
};

export const ParticipantCountdown: Story = {
  decorators: [withFrames(orbiting(4000), countdownStart)],
  args: { block: build({ started_at: countdownStart }), viewContext: 'participant' },
};

export const ParticipantPlaying: Story = {
  decorators: [withFrames(orbiting(4000))],
  args: { block: build(), viewContext: 'participant' },
};

export const ParticipantEaten: Story = {
  decorators: [withFrames(orbiting(4000, 2), PAST_START, 2)],
  args: { block: build(), viewContext: 'participant' },
};

export const ParticipantSpectator: Story = {
  decorators: [withFrames(orbiting(4000))],
  args: {
    block: build({ roster: ROSTER.filter((id) => id !== mockParticipant.id) }),
    viewContext: 'participant',
  },
};

export const ParticipantEnded: Story = {
  args: {
    block: build({
      ended_at: new Date().toISOString(),
      standings,
      winner_participant_id: ROSTER[0],
    }),
    viewContext: 'participant',
  },
};

export const MonitorWaiting: Story = {
  args: { block: build({ started_at: null, roster: [] }), viewContext: 'monitor' },
};

export const MonitorRunning: Story = {
  decorators: [withFrames(orbiting(4000))],
  args: { block: build(), viewContext: 'monitor' },
};

export const MonitorPodium: Story = {
  args: {
    block: build({
      ended_at: new Date().toISOString(),
      standings,
      winner_participant_id: ROSTER[0],
    }),
    viewContext: 'monitor',
  },
};

export const ManageRunning: Story = {
  decorators: [withFrames(orbiting(4000))],
  args: { block: build(), viewContext: 'manage' },
};

export const ManageEnded: Story = {
  args: {
    block: build({
      ended_at: new Date().toISOString(),
      standings,
      winner_participant_id: ROSTER[0],
    }),
    viewContext: 'manage',
  },
};

/** Idle, moving, and dashing avatars side by side for tuning the wiggle. */
export const Wiggle: Story = {
  decorators: [withFrames(wiggleLineup)],
  args: { block: build({ world_size: 600 }), viewContext: 'monitor' },
};
