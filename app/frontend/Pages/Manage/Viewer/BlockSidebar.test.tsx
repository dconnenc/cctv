import type { ReactNode } from 'react';

import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Block, BlockStatus } from '@cctv/types';

import BlockSidebar from './BlockSidebar';

// Capture the onDragEnd callback so tests can invoke it directly
let capturedOnDragEnd: ((result: unknown) => void) | null = null;

vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({
    children,
    onDragEnd,
  }: {
    children: ReactNode;
    onDragEnd: (result: unknown) => void;
  }) => {
    capturedOnDragEnd = onDragEnd;
    return <>{children}</>;
  },
  Droppable: ({ children }: { children: (provided: object, snapshot: object) => ReactNode }) =>
    children(
      { innerRef: () => {}, droppableProps: {}, placeholder: null },
      { isDraggingOver: false },
    ),
  Draggable: ({ children }: { children: (provided: object, snapshot: object) => ReactNode }) =>
    children(
      {
        innerRef: () => {},
        draggableProps: { style: {} },
        dragHandleProps: {},
      },
      { isDragging: false },
    ),
}));

function makeBlock(id: string, overrides: Partial<Block> = {}): Block {
  return {
    id,
    kind: 'announcement',
    status: 'hidden' as BlockStatus,
    position: 0,
    payload: { message: id, show_on_monitor: false },
    ...overrides,
  } as Block;
}

const defaultProps = {
  selectedBlockId: null,
  sidebarCollapsed: false,
  hasBlocks: true,
  onSelectBlock: vi.fn(),
  onToggleSidebar: vi.fn(),
  onCreateBlock: vi.fn(),
  onReorderBlock: vi.fn(),
};

function dropResult(overrides: object) {
  return {
    draggableId: 'block-a',
    source: { index: 0, droppableId: 'top-level' },
    destination: { index: 1, droppableId: 'top-level' },
    type: 'PARENT',
    mode: 'FLUID',
    reason: 'DROP',
    combine: null,
    ...overrides,
  };
}

describe('BlockSidebar — handleDragEnd', () => {
  beforeEach(() => {
    capturedOnDragEnd = null;
    vi.clearAllMocks();
  });

  describe('no-op conditions', () => {
    it('does nothing when there is no destination (drag cancelled)', () => {
      const blocks = [makeBlock('block-a'), makeBlock('block-b')];
      render(<BlockSidebar {...defaultProps} blocks={blocks} />);

      capturedOnDragEnd!(dropResult({ destination: null }));

      expect(defaultProps.onReorderBlock).not.toHaveBeenCalled();
    });

    it('does nothing when source and destination index are the same', () => {
      const blocks = [makeBlock('block-a'), makeBlock('block-b')];
      render(<BlockSidebar {...defaultProps} blocks={blocks} />);

      capturedOnDragEnd!(
        dropResult({
          source: { index: 1, droppableId: 'top-level' },
          destination: { index: 1, droppableId: 'top-level' },
        }),
      );

      expect(defaultProps.onReorderBlock).not.toHaveBeenCalled();
    });

    it('does nothing when onReorderBlock is not provided', () => {
      const blocks = [makeBlock('block-a'), makeBlock('block-b')];

      expect(() =>
        render(<BlockSidebar {...defaultProps} onReorderBlock={undefined} blocks={blocks} />),
      ).not.toThrow();

      capturedOnDragEnd!(dropResult({}));
      // no assertion needed — just must not throw
    });
  });

  describe('top-level reorder', () => {
    it('calls onReorderBlock with blockId and new index', () => {
      const blocks = [makeBlock('block-a'), makeBlock('block-b'), makeBlock('block-c')];
      render(<BlockSidebar {...defaultProps} blocks={blocks} />);

      capturedOnDragEnd!(
        dropResult({
          draggableId: 'block-a',
          source: { index: 0, droppableId: 'top-level' },
          destination: { index: 2, droppableId: 'top-level' },
        }),
      );

      expect(defaultProps.onReorderBlock).toHaveBeenCalledWith('block-a', 2);
    });

    it('calls onReorderBlock without a parentBlockId', () => {
      const blocks = [makeBlock('block-a'), makeBlock('block-b')];
      render(<BlockSidebar {...defaultProps} blocks={blocks} />);

      capturedOnDragEnd!(
        dropResult({
          draggableId: 'block-b',
          source: { index: 1, droppableId: 'top-level' },
          destination: { index: 0, droppableId: 'top-level' },
        }),
      );

      expect(defaultProps.onReorderBlock).toHaveBeenCalledTimes(1);
      const [, , parentArg] = (defaultProps.onReorderBlock as ReturnType<typeof vi.fn>).mock
        .calls[0];
      expect(parentArg).toBeUndefined();
    });

    it('updates the rendered block order optimistically', () => {
      const blocks = [makeBlock('block-a'), makeBlock('block-b'), makeBlock('block-c')];
      render(<BlockSidebar {...defaultProps} blocks={blocks} />);

      // Before drag: order is a, b, c
      let items = screen.getAllByRole('listitem');
      expect(items[0]).toHaveAttribute('data-block-id', 'block-a');
      expect(items[2]).toHaveAttribute('data-block-id', 'block-c');

      // Move block-a from index 0 to index 2
      act(() => {
        capturedOnDragEnd!(
          dropResult({
            draggableId: 'block-a',
            source: { index: 0, droppableId: 'top-level' },
            destination: { index: 2, droppableId: 'top-level' },
          }),
        );
      });

      items = screen.getAllByRole('listitem');
      expect(items[0]).toHaveAttribute('data-block-id', 'block-b');
      expect(items[1]).toHaveAttribute('data-block-id', 'block-c');
      expect(items[2]).toHaveAttribute('data-block-id', 'block-a');
    });
  });
});
