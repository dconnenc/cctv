import React from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { ExperienceSeeder } from '../../../../.storybook/ExperienceSeeder';
import { liveExperienceWithActiveBlock, lobbyExperience } from '../../../../.storybook/fixtures';
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
};

export const WithActiveBlock: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder monitorView={liveExperienceWithActiveBlock}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
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
};

export const NoData: Story = {};
