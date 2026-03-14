import type { Meta, StoryObj } from '@storybook/react-vite';

import Announcement from './Announcement';

const meta: Meta<typeof Announcement> = {
  title: 'Experiences/Announcement',
  component: Announcement,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Announcement>;

export const Default: Story = {
  args: {
    message: 'Welcome to the show!',
  },
};

export const WithParticipantName: Story = {
  args: {
    message: 'Hey {{ participant_name }}, get ready!',
    participant: {
      id: '1',
      user_id: '1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'player',
    },
  },
};

export const LongMessage: Story = {
  args: {
    message:
      'This is a longer announcement that contains more information for the audience. Please pay attention to the instructions that follow.',
  },
};
