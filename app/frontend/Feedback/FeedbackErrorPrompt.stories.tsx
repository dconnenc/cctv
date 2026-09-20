import type { Meta, StoryObj } from '@storybook/react-vite';

import { FeedbackErrorPrompt } from './FeedbackErrorPrompt';

const meta: Meta<typeof FeedbackErrorPrompt> = {
  title: 'Feedback/FeedbackErrorPrompt',
  component: FeedbackErrorPrompt,
  args: {
    onDescribe: () => {},
    onDismiss: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof FeedbackErrorPrompt>;

// Shown after an error has already been filed. Dismissing costs nothing but the
// user's account of what they were doing.
export const Default: Story = {
  args: { message: "Cannot read properties of undefined (reading 'options')" },
};

// Long messages truncate rather than pushing the actions off screen.
export const LongMessage: Story = {
  args: {
    message:
      'POST /api/experiences/:code/blocks/:id/submit_poll_response failed with 500 after the websocket reconnected mid-submission',
  },
};
