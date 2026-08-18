import type { Meta, StoryObj } from '@storybook/react-vite';

import { BlockKind, MinigameBalloonPumpBlock } from '@cctv/types';

import MinigameControls from './MinigameControls';

function build(
  payload: Partial<MinigameBalloonPumpBlock['payload']> = {},
): MinigameBalloonPumpBlock {
  return {
    id: 'balloon-1',
    kind: BlockKind.MINIGAME_BALLOON_PUMP,
    status: 'open',
    position: 0,
    payload: {
      variant: 'balloon_pump',
      target_units: 50,
      started_at: null,
      ended_at: null,
      winner_participant_ids: [],
      ...payload,
    },
  };
}

const meta: Meta<typeof MinigameControls> = {
  title: 'Manage/MinigameControls',
  component: MinigameControls,
  decorators: [
    (Story) => (
      <div className="flex items-center gap-2">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof MinigameControls>;

// Not started yet: only "Start minigame" is offered.
export const Queued: Story = {
  args: { block: build() },
};

// Running: host can end the game or reset it back to a fresh state.
export const Running: Story = {
  args: { block: build({ started_at: new Date().toISOString() }) },
};

// Ended: host can start a new round or reset to a fresh, startable state.
export const Ended: Story = {
  args: {
    block: build({
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
    }),
  },
};
