import type { Meta, StoryObj } from '@storybook/react-vite';

import { ExperienceSeeder } from '../../../../.storybook/ExperienceSeeder';
import {
  emptyExperience,
  liveExperience,
  liveExperienceWithActiveBlock,
  lobbyExperience,
  mockParticipant,
  pausedExperience,
} from '../../../../.storybook/fixtures';
import Experience from './Experience';

const meta: Meta<typeof Experience> = {
  title: 'Pages/Experience',
  component: Experience,
};
export default meta;

type Story = StoryObj<typeof Experience>;

export const Lobby: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder experience={lobbyExperience} participant={mockParticipant}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
};

export const LobbyEmpty: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder experience={emptyExperience} participant={mockParticipant}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
};

export const LiveWithBlock: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder
        experience={liveExperienceWithActiveBlock}
        participant={mockParticipant}
        experienceStatus="live"
      >
        <Story />
      </ExperienceSeeder>
    ),
  ],
};

export const LiveWaitingForBlock: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder
        experience={{ ...liveExperience, blocks: [] }}
        participant={mockParticipant}
        experienceStatus="live"
      >
        <Story />
      </ExperienceSeeder>
    ),
  ],
};

export const Paused: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder
        experience={pausedExperience}
        participant={mockParticipant}
        experienceStatus="live"
      >
        <Story />
      </ExperienceSeeder>
    ),
  ],
};

export const Error: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder experience={undefined} participant={undefined}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
};
