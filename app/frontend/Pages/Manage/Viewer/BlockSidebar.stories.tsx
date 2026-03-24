import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';

import type { Block } from '@cctv/types';

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

function block(
  id: string,
  kind: Block['kind'],
  status: Block['status'],
  overrides: Partial<Block> = {},
): Block {
  return {
    id,
    kind,
    status,
    position: 0,
    payload: {},
    ...overrides,
  } as Block;
}

const flatBlocks: Block[] = [
  block('b1', 'announcement', 'open'),
  block('b2', 'poll', 'closed'),
  block('b3', 'question', 'hidden'),
];

const blocksWithChildren: Block[] = [
  block('b1', 'mad_lib', 'open', {
    children: [block('c1', 'poll', 'closed'), block('c2', 'question', 'hidden')],
  }),
  block('b2', 'announcement', 'hidden'),
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
