import React from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

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
