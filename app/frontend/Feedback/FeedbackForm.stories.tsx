import type { Meta, StoryObj } from '@storybook/react-vite';

import { FeedbackSource, FeedbackType } from '@cctv/types';

import { FeedbackForm } from './FeedbackForm';

const meta: Meta<typeof FeedbackForm> = {
  title: 'Feedback/FeedbackForm',
  component: FeedbackForm,
  args: { onSubmitted: () => {} },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '32rem', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof FeedbackForm>;

// The global panel: every type is offered and the title is optional.
export const Manual: Story = {
  args: { source: FeedbackSource.MANUAL },
};

// Adding detail to an error the client already filed — the type is pinned to Bug.
export const EnrichingAnError: Story = {
  args: {
    source: FeedbackSource.MANUAL,
    enrichFeedbackId: 'feedback-1',
    defaultType: FeedbackType.BUG,
    availableTypes: [FeedbackType.BUG],
    submitLabel: 'Add details',
  },
};

// A feedback block configured by the host with a narrowed set of types.
export const FromBlock: Story = {
  args: {
    source: FeedbackSource.BLOCK,
    experienceBlockId: 'block-1',
    availableTypes: [FeedbackType.EXPERIENCE, FeedbackType.GENERAL],
    submitLabel: 'Submit',
  },
};

// Hosts can require a title, which keeps the submit button disabled until set.
export const TitleRequired: Story = {
  args: {
    source: FeedbackSource.BLOCK,
    experienceBlockId: 'block-1',
    requireTitle: true,
    submitLabel: 'Submit',
  },
};
