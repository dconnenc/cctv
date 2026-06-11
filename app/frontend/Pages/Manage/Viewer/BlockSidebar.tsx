import { useEffect, useMemo, useState } from 'react';

import { DragDropContext, Draggable, type DropResult, Droppable } from '@hello-pangea/dnd';
import classNames from 'classnames';
import { ChevronLeft, ChevronRight, GripVertical, Link2, Plus, Sparkles } from 'lucide-react';

import { Button } from '@cctv/core/Button/Button';
import { BLOCK_KIND_LABELS, Block, BlockKind, QuestionPayload } from '@cctv/types';

import styles from './BlockSidebar.module.scss';

const isSyntheticQuestion = (block: Block): boolean =>
  block.kind === BlockKind.QUESTION && Boolean((block.payload as QuestionPayload)?.synthetic);

interface BlockSidebarProps {
  blocks: Block[];
  selectedBlockId: string | null;
  sidebarCollapsed: boolean;
  hasBlocks: boolean;
  onSelectBlock: (id: string) => void;
  onToggleSidebar: () => void;
  onCreateBlock: () => void;
  onReorderBlock?: (blockId: string, newIndex: number) => void;
}

export default function BlockSidebar({
  blocks,
  selectedBlockId,
  sidebarCollapsed,
  hasBlocks,
  onSelectBlock,
  onToggleSidebar,
  onCreateBlock,
  onReorderBlock,
}: BlockSidebarProps) {
  const [localBlocks, setLocalBlocks] = useState<Block[]>(blocks);

  useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

  const parentLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of blocks) {
      map.set(b.id, BLOCK_KIND_LABELS[b.kind]);
    }
    return map;
  }, [blocks]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorderBlock) return;
    if (result.source.index === result.destination.index) return;

    const { draggableId, source, destination } = result;

    setLocalBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(source.index, 1);
      next.splice(destination.index, 0, moved);
      return next;
    });
    onReorderBlock(draggableId, destination.index);
  };

  return (
    <aside
      className={classNames(styles.sidebar, {
        [styles.collapsed]: sidebarCollapsed,
        [styles.expanded]: !sidebarCollapsed,
      })}
    >
      <div className={styles.header}>
        {!sidebarCollapsed && <div className={styles.headerTitle}>Blocks</div>}
        <div
          className={classNames(styles.headerActions, {
            [styles.collapsedActions]: sidebarCollapsed,
          })}
        >
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus size={16} />}
              hideLabel
              onClick={onCreateBlock}
              title="Create Block"
            >
              Create Block
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            hideLabel
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        {sidebarCollapsed ? (
          <ul className={styles.collapsedList}>
            {localBlocks.map((block, index) => (
              <li key={block.id}>
                <Button
                  variant="outline"
                  className={classNames(styles.iconButton, {
                    [styles.selected]: selectedBlockId === block.id,
                    [styles.hiddenBlock]: block.status === 'hidden',
                    [styles.childItem]: Boolean(block.parent_block_id),
                  })}
                  onClick={() => onSelectBlock(block.id)}
                  title={`${BLOCK_KIND_LABELS[block.kind]} - ${block.status}`}
                >
                  <span className={styles.statusBadge} data-status={block.status}>
                    <span className="sr-only">
                      {BLOCK_KIND_LABELS[block.kind]} - {block.status}
                    </span>
                    <span className={styles.statusBadgeIndex}>{index + 1}</span>
                  </span>
                </Button>
              </li>
            ))}
            <li>
              <Button
                variant="outline"
                size="lg"
                icon={<Plus size={20} />}
                hideLabel
                onClick={onCreateBlock}
                title="Create Block"
              >
                Create Block
              </Button>
            </li>
          </ul>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="blocks" type="BLOCK">
              {(provided) => (
                <ul
                  className={styles.expandedList}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {localBlocks.map((block, index) => {
                    const parentKindLabel = block.parent_block_id
                      ? parentLabelById.get(block.parent_block_id)
                      : undefined;

                    return (
                      <Draggable key={block.id} draggableId={block.id} index={index}>
                        {(dragProvided, snapshot) => (
                          <li
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            style={dragProvided.draggableProps.style}
                            aria-label={`block ${index + 1}`}
                            data-block-id={block.id}
                            className={classNames({ [styles.childItem]: Boolean(parentKindLabel) })}
                          >
                            <Button
                              variant="outline"
                              className={classNames(styles.blockButton, {
                                [styles.selected]: selectedBlockId === block.id,
                                [styles.hiddenBlock]: block.status === 'hidden',
                                [styles.dragging]: snapshot.isDragging,
                              })}
                              onClick={() => onSelectBlock(block.id)}
                            >
                              <div className={styles.blockRow}>
                                <span
                                  {...dragProvided.dragHandleProps}
                                  data-drag-handle
                                  className={styles.dragHandle}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical size={14} />
                                </span>
                                <span className={styles.blockIndex}>{index + 1}</span>
                                <span className={styles.statusDot} data-status={block.status} />
                                <span className={styles.blockKind}>
                                  {isSyntheticQuestion(block)
                                    ? 'Synthetic Question'
                                    : BLOCK_KIND_LABELS[block.kind]}
                                </span>
                                {isSyntheticQuestion(block) && (
                                  <Sparkles
                                    size={12}
                                    className={styles.syntheticIcon}
                                    aria-hidden="true"
                                  />
                                )}
                                {block.status === 'open' && (
                                  <span className={styles.liveBadge}>Live</span>
                                )}
                              </div>
                              {parentKindLabel && (
                                <div className={styles.childContext}>
                                  <Link2 size={11} aria-hidden="true" />
                                  <span>{parentKindLabel}</span>
                                </div>
                              )}
                              {block.responses && block.responses.total > 0 && (
                                <div className={styles.responseCount}>
                                  {block.responses.total} response
                                  {block.responses.total !== 1 ? 's' : ''}
                                </div>
                              )}
                            </Button>
                          </li>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                  {!hasBlocks && <li className={styles.emptyState}>No blocks yet</li>}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </aside>
  );
}
