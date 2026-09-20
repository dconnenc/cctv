import type { Meta, StoryObj } from '@storybook/react-vite';

import { FeedbackType } from '@cctv/types';

import { FeedbackPanel } from './FeedbackPanel';

const meta: Meta<typeof FeedbackPanel> = {
  title: 'Feedback/FeedbackPanel',
  component: FeedbackPanel,
  args: { onOpenChange: () => {} },
};
export default meta;

type Story = StoryObj<typeof FeedbackPanel>;

// Opened from the floating trigger. A drawer rather than a route, so an
// in-progress experience keeps running behind it.
export const Open: Story = {
  args: { open: true },
};

// Opened from the error prompt, which changes the copy and pins the type.
export const EnrichingAnError: Story = {
  args: { open: true, enrichFeedbackId: 'feedback-1', defaultType: FeedbackType.BUG },
};

export const Closed: Story = {
  args: { open: false },
};
