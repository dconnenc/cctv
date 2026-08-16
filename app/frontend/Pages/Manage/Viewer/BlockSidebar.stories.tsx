import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';

import type { Block } from '@cctv/types';

import { announcementBlock, familyFeudBlock, pollBlock, questionBlock } from '../testFactories';
import BlockSidebar from './BlockSidebar';

const meta: Meta<typeof BlockSidebar> = {
  title: 'Manage/BlockSidebar',
  component: BlockSidebar,
  tags: ['autodocs'],
  args: {
    onSelectBlock: fn(),
    onToggleSidebar: fn(),
    onCreateBlock: fn(),
    onReorderBlock: fn(),
    selectedBlockId: null,
    sidebarCollapsed: false,
    hasBlocks: true,
  },
};
export default meta;

type Story = StoryObj<typeof BlockSidebar>;

const flatBlocks: Block[] = [
  announcementBlock({ id: 'b1', status: 'open', position: 0 }),
  pollBlock({ id: 'b2', status: 'closed', position: 1, responses: { total: 24 } }),
  questionBlock({ id: 'b3', status: 'hidden', position: 2 }),
];

const blocksWithChildren: Block[] = [
  familyFeudBlock({ id: 'b1', status: 'open', position: 0 }),
  pollBlock({ id: 'c1', status: 'closed', position: 1, parent_block_id: 'b1' }),
  questionBlock({
    id: 'c2',
    status: 'hidden',
    position: 2,
    parent_block_id: 'b1',
    payload: { question: '', formKey: 'answer_1', synthetic: true },
  }),
  announcementBlock({ id: 'b2', status: 'hidden', position: 3 }),
];

export const Expanded: Story = {
  args: { blocks: flatBlocks },
};

export const ExpandedWithSelection: Story = {
  args: { blocks: flatBlocks, selectedBlockId: 'b2' },
};

export const ExpandedWithChildren: Story = {
  args: { blocks: blocksWithChildren },
};

export const ExpandedEmpty: Story = {
  args: { blocks: [], hasBlocks: false },
};

export const Collapsed: Story = {
  args: { blocks: flatBlocks, sidebarCollapsed: true },
};

export const CollapsedWithChildren: Story = {
  args: { blocks: blocksWithChildren, sidebarCollapsed: true },
};

export const CollapsedWithSelection: Story = {
  args: { blocks: flatBlocks, sidebarCollapsed: true, selectedBlockId: 'b1' },
};
