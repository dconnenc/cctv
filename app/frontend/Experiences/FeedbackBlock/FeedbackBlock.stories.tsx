import type { Meta, StoryObj } from '@storybook/react-vite';

import { BlockKind, FeedbackBlock as FeedbackBlockType, FeedbackType } from '@cctv/types';

import FeedbackBlock from './FeedbackBlock';

const block: FeedbackBlockType = {
  id: 'block-feedback',
  kind: BlockKind.FEEDBACK,
  status: 'open',
  position: 0,
  payload: {
    prompt: 'How was the show tonight?',
    allowed_types: [FeedbackType.EXPERIENCE, FeedbackType.BUG, FeedbackType.GENERAL],
    require_title: false,
  },
  responses: { total: 12 },
};

const meta: Meta<typeof FeedbackBlock> = {
  title: 'Experiences/FeedbackBlock',
  component: FeedbackBlock,
  args: { block },
};
export default meta;

type Story = StoryObj<typeof FeedbackBlock>;

// What the audience sees while the block is open.
export const Participant: Story = {
  args: { viewContext: 'participant' },
};

// Closed blocks keep the prompt visible but stop accepting submissions.
export const Closed: Story = {
  args: { viewContext: 'participant', disabled: true },
};

// The monitor projects the prompt only — responses are private.
export const Monitor: Story = {
  args: { viewContext: 'monitor' },
};

// Hosts see a count, not the responses, since triage happens in Linear.
export const Manage: Story = {
  args: { viewContext: 'manage' },
};
