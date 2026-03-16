import { useCallback, useRef } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from '@storybook/test';

import { ExperienceSeeder } from '../../../../.storybook/ExperienceSeeder';
import {
  liveExperienceWithActiveBlock,
  lobbyExperience,
  mockAnnouncementBlock,
  mockParticipants,
} from '../../../../.storybook/fixtures';
import { useExperienceState } from '../../../../app/frontend/Contexts';
import type { Experience } from '../../../../app/frontend/types';
import Monitor from './Monitor';

const meta: Meta<typeof Monitor> = {
  title: 'Pages/Monitor',
  component: Monitor,
};
export default meta;

type Story = StoryObj<typeof Monitor>;

export const LobbyView: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder monitorView={lobbyExperience}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const konvaCanvas = canvasElement.querySelector('canvas');
    await expect(konvaCanvas).toBeInTheDocument();

    await expect(canvas.getByText('DEMO')).toBeInTheDocument();
  },
};

export const WithActiveBlock: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder monitorView={liveExperienceWithActiveBlock}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("What's your favorite city?")).toBeInTheDocument();

    const konvaCanvas = canvasElement.querySelector('canvas');
    await expect(konvaCanvas).toBeInTheDocument();
  },
};

export const CheckYourDevices: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder
        monitorView={{ ...lobbyExperience, blocks: [], participant_block_active: true }}
      >
        <Story />
      </ExperienceSeeder>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Check your devices')).toBeInTheDocument();

    const konvaCanvas = canvasElement.querySelector('canvas');
    await expect(konvaCanvas).toBeInTheDocument();
  },
};

const playerIds = mockParticipants.filter((p) => p.role !== 'host').map((p) => p.id);

function ResponseSimulator({
  baseExperience,
  children,
}: {
  baseExperience: Experience;
  children: React.ReactNode;
}) {
  const state = useExperienceState();
  const respondedRef = useRef<string[]>([]);

  const addResponse = useCallback(
    (participantId: string) => {
      respondedRef.current = [...respondedRef.current, participantId];
      state.setMonitorView({
        ...baseExperience,
        responded_participant_ids: [...respondedRef.current],
      });
    },
    [baseExperience, state],
  );

  return (
    <>
      {children}
      <div
        style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 100, display: 'flex', gap: 8 }}
      >
        {playerIds.map((id) => {
          const name = mockParticipants.find((p) => p.id === id)?.name;
          return (
            <button
              key={id}
              data-testid={`respond-${id}`}
              onClick={() => addResponse(id)}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {name} responds
            </button>
          );
        })}
      </div>
    </>
  );
}

export const ResponsesLightUp: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder monitorView={liveExperienceWithActiveBlock}>
        <ResponseSimulator baseExperience={liveExperienceWithActiveBlock}>
          <Story />
        </ResponseSimulator>
      </ExperienceSeeder>
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("What's your favorite city?")).toBeInTheDocument();

    const konvaCanvas = canvasElement.querySelector('canvas');
    await expect(konvaCanvas).toBeInTheDocument();

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (const id of playerIds) {
      const name = mockParticipants.find((p) => p.id === id)?.name;

      await step(`${name} responds`, async () => {
        await delay(1500);
        const btn = canvas.getByTestId(`respond-${id}`);
        await userEvent.click(btn);
      });
    }

    await step('All players have responded', async () => {
      await delay(1000);
    });
  },
};

export const WithActiveBlockAllResponded: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder
        monitorView={{
          ...liveExperienceWithActiveBlock,
          responded_participant_ids: mockParticipants
            .filter((p) => p.role !== 'host')
            .map((p) => p.id),
        }}
      >
        <Story />
      </ExperienceSeeder>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("What's your favorite city?")).toBeInTheDocument();

    const konvaCanvas = canvasElement.querySelector('canvas');
    await expect(konvaCanvas).toBeInTheDocument();
  },
};

export const ParticipantBlockWithResponses: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder
        monitorView={{
          ...lobbyExperience,
          blocks: [],
          participant_block_active: true,
          responded_participant_ids: [mockParticipants[1].id],
        }}
      >
        <Story />
      </ExperienceSeeder>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Check your devices')).toBeInTheDocument();

    const konvaCanvas = canvasElement.querySelector('canvas');
    await expect(konvaCanvas).toBeInTheDocument();
  },
};

export const AnnouncementNoResponses: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder
        monitorView={{
          ...lobbyExperience,
          status: 'live',
          blocks: [mockAnnouncementBlock],
        }}
      >
        <Story />
      </ExperienceSeeder>
    ),
  ],
  play: async ({ canvasElement }) => {
    const konvaCanvas = canvasElement.querySelector('canvas');
    await expect(konvaCanvas).toBeInTheDocument();
  },
};

export const NoData: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Loading Monitor view...')).toBeInTheDocument();
  },
};
