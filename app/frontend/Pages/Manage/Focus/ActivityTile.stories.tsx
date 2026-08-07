import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';

import { BLOCK_KIND_LABELS, BlockKind } from '@cctv/types';

import { ActivityTile } from './ActivityTile';

const meta: Meta<typeof ActivityTile> = {
  title: 'Manage/Focus/ActivityTile',
  component: ActivityTile,
  tags: ['autodocs'],
  args: {
    onClick: fn(),
    kind: BlockKind.POLL,
    label: 'Poll',
  },
};
export default meta;

type Story = StoryObj<typeof ActivityTile>;

export const Kind: Story = {};

export const Draft: Story = {
  args: {
    isDraft: true,
    label: 'Which sketch should close the show?',
  },
};

export const DraftWithSummary: Story = {
  args: {
    isDraft: true,
    kind: BlockKind.QUESTION,
    label: 'Audience warm-up',
    summary: 'What is the worst advice you have ever been given?',
  },
};

export const EveryKind: Story = {
  render: (args) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(13rem, 1fr))',
        gap: '0.875rem',
      }}
    >
      {Object.values(BlockKind).map((kind) => (
        <ActivityTile
          key={kind}
          kind={kind}
          label={BLOCK_KIND_LABELS[kind]}
          onClick={args.onClick}
        />
      ))}
    </div>
  ),
};
