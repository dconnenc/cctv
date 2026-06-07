import type { Meta, StoryObj } from '@storybook/react-vite';

import { BlockKind } from '@cctv/types';

import { ExperienceSeeder } from '../../../../.storybook/ExperienceSeeder';
import { experienceNoPlaybill, lobbyExperience } from '../../../../.storybook/fixtures';
import Playbill from './Playbill';

const meta: Meta<typeof Playbill> = {
  title: 'Pages/Playbill',
  component: Playbill,
};
export default meta;

type Story = StoryObj<typeof Playbill>;

export const WithSections: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder experience={lobbyExperience} participant={undefined}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
};

export const EmptySections: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder experience={{ ...lobbyExperience, playbill: [] }} participant={undefined}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
};

export const Disabled: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder experience={experienceNoPlaybill} participant={undefined}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
};

export const RunningOrderPopulated: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder experience={lobbyExperience} participant={undefined}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
};

export const RunningOrderWithTemplatedTitle: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder
        experience={{
          ...lobbyExperience,
          playbill_running_order: [
            {
              id: 'block-greeting',
              kind: BlockKind.ANNOUNCEMENT,
              position: 0,
              playbill_mysterious: false,
              title: 'Hello {{ participant_name }}',
            },
          ],
        }}
        participant={{
          id: 'p1',
          user_id: 'u1',
          name: 'Jordan',
          email: 'jordan@example.com',
          role: 'player',
        }}
      >
        <Story />
      </ExperienceSeeder>
    ),
  ],
};

export const RunningOrderEmpty: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder
        experience={{ ...lobbyExperience, playbill_running_order: [] }}
        participant={undefined}
      >
        <Story />
      </ExperienceSeeder>
    ),
  ],
};
