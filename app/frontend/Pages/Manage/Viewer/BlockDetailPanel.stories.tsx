import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';

import { announcementBlock, pollBlock } from '../testFactories';
import BlockDetailPanel from './BlockDetailPanel';

const sharedArgs = {
  viewMode: 'block' as const,
  monitorView: undefined,
  participantView: undefined,
  impersonatedParticipantId: undefined,
  participants: [],
  onViewModeChange: fn(),
  onImpersonatedParticipantChange: fn(),
  onEdit: fn(),
  onDelete: fn(),
};

const meta: Meta<typeof BlockDetailPanel> = {
  title: 'Manage/BlockDetailPanel',
  component: BlockDetailPanel,
  tags: ['autodocs'],
  args: sharedArgs,
};
export default meta;

type Story = StoryObj<typeof BlockDetailPanel>;

export const Default: Story = {
  args: {
    selectedBlock: pollBlock({ id: 'b1', status: 'hidden' }),
  },
};

export const OpenBlock: Story = {
  args: {
    selectedBlock: announcementBlock({ id: 'b2', status: 'open' }),
    currentOpenBlock: announcementBlock({ id: 'b2', status: 'open' }),
  },
};

// Targeted block — visible_to_roles set, shows "Targeted" badge in header
export const TargetedBlock: Story = {
  args: {
    selectedBlock: pollBlock({ id: 'b3', status: 'hidden', visible_to_roles: ['host'] }),
  },
};

// Child block — has parent_block_id, shows "Detach" instead of "Edit"
export const ChildBlock: Story = {
  args: {
    selectedBlock: pollBlock({ id: 'b4', status: 'hidden', parent_block_id: 'b-parent' }),
    onDetach: fn(),
  },
};

// Delete confirm state — canDelete is true (closed status), confirmingDelete shown via action
export const ClosedReadyToDelete: Story = {
  args: {
    selectedBlock: pollBlock({ id: 'b5', status: 'closed' }),
  },
};
