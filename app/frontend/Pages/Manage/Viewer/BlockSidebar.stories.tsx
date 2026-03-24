import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';

import { BlockKind } from '@cctv/types';
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
  block('b1', BlockKind.ANNOUNCEMENT, 'open'),
  block('b2', BlockKind.POLL, 'closed'),
  block('b3', BlockKind.QUESTION, 'hidden'),
];

const blocksWithChildren: Block[] = [
  block('b1', BlockKind.MAD_LIB, 'open', {
    children: [block('c1', BlockKind.POLL, 'closed'), block('c2', BlockKind.QUESTION, 'hidden')],
  }),
  block('b2', BlockKind.ANNOUNCEMENT, 'hidden'),
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
