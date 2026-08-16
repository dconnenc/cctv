import type { ReactNode } from 'react';

import type {
  DraggableProvided,
  DraggableStateSnapshot,
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
} from '@hello-pangea/dnd';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnnouncementBlock } from '@cctv/types';

import { announcementBlock, questionBlock } from '../testFactories';
import BlockSidebar from './BlockSidebar';

// Capture the onDragEnd callback so tests can invoke it directly
let capturedOnDragEnd: ((result: DropResult) => void) | null = null;

vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({
    children,
    onDragEnd,
  }: {
    children: ReactNode;
    onDragEnd: (result: DropResult) => void;
  }) => {
    capturedOnDragEnd = onDragEnd;
    return <>{children}</>;
  },
  Droppable: ({
    children,
  }: {
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => ReactNode;
  }) =>
    children(
      {
        innerRef: () => {},
        droppableProps: {
          'data-rfd-droppable-context-id': 'test-context',
          'data-rfd-droppable-id': 'blocks',
        },
        placeholder: null,
      },
      {
        isDraggingOver: false,
        draggingOverWith: null,
        draggingFromThisWith: null,
        isUsingPlaceholder: false,
      },
    ),
  Draggable: ({
    children,
  }: {
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => ReactNode;
  }) =>
    children(
      {
        innerRef: () => {},
        draggableProps: {
          style: {},
          'data-rfd-draggable-context-id': 'test-context',
          'data-rfd-draggable-id': 'test-draggable',
        },
        dragHandleProps: null,
      },
      {
        isDragging: false,
        isDropAnimating: false,
        isClone: false,
        dropAnimation: null,
        draggingOver: null,
        combineWith: null,
        combineTargetFor: null,
        mode: null,
      },
    ),
}));

function makeBlock(id: string): AnnouncementBlock {
  return announcementBlock({ id, payload: { message: id, show_on_monitor: false } });
}

const defaultProps = {
  selectedBlockId: null,
  sidebarCollapsed: false,
  hasBlocks: true,
  onSelectBlock: vi.fn(),
  onToggleSidebar: vi.fn(),
  onCreateBlock: vi.fn(),
  onReorderBlock: vi.fn<(blockId: string, newIndex: number, parentBlockId?: string) => void>(),
};

function dropResult(overrides: Partial<DropResult> = {}): DropResult {
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
      const [, , parentArg] = defaultProps.onReorderBlock.mock.calls[0];
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

  describe('synthetic question label', () => {
    it('labels a synthetic question distinctly from a normal question', () => {
      const blocks = [
        questionBlock({
          id: 'q-normal',
          parent_block_id: 'ff',
          payload: { question: 'Name a fruit', formKey: 'answer_0' },
        }),
        questionBlock({
          id: 'q-synthetic',
          parent_block_id: 'ff',
          payload: { question: '', formKey: 'answer_1', synthetic: true },
        }),
      ];
      render(<BlockSidebar {...defaultProps} blocks={blocks} />);

      expect(screen.getByText('Synthetic Question')).toBeInTheDocument();
      expect(screen.getByText('Question')).toBeInTheDocument();
    });
  });
});
