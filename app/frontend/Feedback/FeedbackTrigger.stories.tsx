import type { Meta, StoryObj } from '@storybook/react-vite';

import { FeedbackTrigger } from './FeedbackTrigger';

const meta: Meta<typeof FeedbackTrigger> = {
  title: 'Feedback/FeedbackTrigger',
  component: FeedbackTrigger,
};
export default meta;

type Story = StoryObj<typeof FeedbackTrigger>;

// Fixed to the bottom-right of the viewport on every page except the monitor
// and playbill. Sits above the safe-area inset on phones.
export const Default: Story = {
  args: { onClick: () => {} },
};
