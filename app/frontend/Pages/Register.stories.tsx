import React from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { ExperienceSeeder } from '../../../.storybook/ExperienceSeeder';
import { lobbyExperience } from '../../../.storybook/fixtures';
import Register from './Register';

const meta: Meta<typeof Register> = {
  title: 'Pages/Register',
  component: Register,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Register>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <ExperienceSeeder experience={lobbyExperience}>
        <Story />
      </ExperienceSeeder>
    ),
  ],
};
