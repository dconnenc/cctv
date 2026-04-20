import { useEffect, useState } from 'react';

import { DragDropContext, Draggable, type DropResult, Droppable } from '@hello-pangea/dnd';
import classNames from 'classnames';
import { ChevronLeft, ChevronRight, GripVertical, Plus } from 'lucide-react';

import { Button } from '@cctv/core/Button/Button';
import { Block } from '@cctv/types';

import styles from './BlockSidebar.module.scss';

interface BlockSidebarProps {
  blocks: Block[];
  selectedBlockId: string | null;
  sidebarCollapsed: boolean;
  hasBlocks: boolean;
  onSelectBlock: (id: string) => void;
  onToggleSidebar: () => void;
  onCreateBlock: () => void;
  onReorderBlock?: (blockId: string, newIndex: number, parentBlockId?: string) => void;
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorderBlock) return;
    if (result.source.index === result.destination.index) return;

    const { draggableId, source, destination } = result;

    if (destination.droppableId === 'top-level') {
      setLocalBlocks((prev) => {
        const next = [...prev];
        const [moved] = next.splice(source.index, 1);
        next.splice(destination.index, 0, moved);
        return next;
      });
      onReorderBlock(draggableId, destination.index);
    } else {
      const parentBlockId = destination.droppableId.replace('children-', '');
      setLocalBlocks((prev) =>
        prev.map((parent) => {
          if (parent.id !== parentBlockId) return parent;
          const children = [...(parent.children || [])];
          const [moved] = children.splice(source.index, 1);
          children.splice(destination.index, 0, moved);
          return { ...parent, children };
        }),
      );
      onReorderBlock(draggableId, destination.index, parentBlockId);
    }
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
            <button onClick={onCreateBlock} title="Create block" aria-label="Create block">
              <Plus size={16} />
            </button>
          )}
          <button
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {sidebarCollapsed ? (
          <ul className={styles.collapsedList}>
            {localBlocks.map((block, parentIndex) => {
              const hasChildren = block.children && block.children.length > 0;
              return hasChildren ? (
                <li key={block.id} className={styles.groupedContainer}>
                  <Button
                    variant="bare"
                    className={classNames(styles.groupedButton, {
                      [styles.selected]: selectedBlockId === block.id,
                      [styles.hiddenBlock]: block.status === 'hidden',
                    })}
                    onClick={() => onSelectBlock(block.id)}
                    title={`${block.kind} - ${block.status}`}
                  >
                    <span className={styles.statusBadge} data-status={block.status}>
                      <span className="sr-only">
                        {block.kind} - {block.status}
                      </span>
                      <span className={styles.statusBadgeIndex}>{parentIndex + 1}</span>
                    </span>
                  </Button>
                  <ul className={styles.groupedList}>
                    {block.children!.map((child, childIndex) => (
                      <li key={child.id}>
                        <Button
                          variant="bare"
                          className={classNames(styles.groupedButton, {
                            [styles.selected]: selectedBlockId === child.id,
                            [styles.hiddenBlock]: child.status === 'hidden',
                          })}
                          onClick={() => onSelectBlock(child.id)}
                          title={`↳ ${child.kind} - ${child.status}`}
                        >
                          <span className={styles.statusBadge} data-status={child.status}>
                            <span className="sr-only">
                              {child.kind} - {child.status}
                            </span>
                            <span className={styles.statusBadgeIndex}>{childIndex + 1}</span>
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={block.id}>
                  <Button
                    variant="subtle"
                    className={classNames(styles.iconButton, {
                      [styles.selected]: selectedBlockId === block.id,
                      [styles.hiddenBlock]: block.status === 'hidden',
                    })}
                    onClick={() => onSelectBlock(block.id)}
                    title={`${block.kind} - ${block.status}`}
                  >
                    <span className={styles.statusBadge} data-status={block.status}>
                      <span className="sr-only">
                        {block.kind} - {block.status}
                      </span>
                      <span className={styles.statusBadgeIndex}>{parentIndex + 1}</span>
                    </span>
                  </Button>
                </li>
              );
            })}
            <li>
              <button onClick={onCreateBlock} title="Create block" aria-label="Create block">
                <Plus size={32} />
              </button>
            </li>
          </ul>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="top-level" type="PARENT">
              {(provided) => (
                <ul
                  className={styles.expandedList}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {localBlocks.map((block, parentIndex) => (
                    <Draggable key={block.id} draggableId={block.id} index={parentIndex}>
                      {(dragProvided, snapshot) => (
                        <li
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          style={dragProvided.draggableProps.style}
                          aria-label={`block ${parentIndex + 1}`}
                          data-block-id={block.id}
                        >
                          <Button
                            variant="subtle"
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
                              <span className={styles.blockIndex}>{parentIndex + 1}</span>
                              <span className={styles.statusDot} data-status={block.status} />
                              <span className={styles.blockKind}>{block.kind}</span>
                              {block.status === 'open' && (
                                <span className={styles.liveBadge}>Live</span>
                              )}
                            </div>
                            {block.responses && block.responses.total > 0 && (
                              <div className={styles.responseCount}>
                                {block.responses.total} response
                                {block.responses.total !== 1 ? 's' : ''}
                              </div>
                            )}
                          </Button>

                          {block.children && block.children.length > 0 && (
                            <Droppable droppableId={`children-${block.id}`} type="CHILD">
                              {(childProvided) => (
                                <ul
                                  ref={childProvided.innerRef}
                                  {...childProvided.droppableProps}
                                  className={styles.expandedList}
                                >
                                  {block.children!.map((child, childIndex) => (
                                    <Draggable
                                      key={child.id}
                                      draggableId={child.id}
                                      index={childIndex}
                                    >
                                      {(childDragProvided, childSnapshot) => (
                                        <li
                                          ref={childDragProvided.innerRef}
                                          {...childDragProvided.draggableProps}
                                          style={childDragProvided.draggableProps.style}
                                          aria-label={`child ${childIndex + 1} of block ${parentIndex + 1}`}
                                          data-block-id={child.id}
                                          className={styles.childItem}
                                        >
                                          <Button
                                            variant="subtle"
                                            className={classNames(styles.blockButton, {
                                              [styles.selected]: selectedBlockId === child.id,
                                              [styles.hiddenBlock]: child.status === 'hidden',
                                              [styles.dragging]: childSnapshot.isDragging,
                                            })}
                                            onClick={() => onSelectBlock(child.id)}
                                          >
                                            <div className={styles.blockRow}>
                                              <span
                                                {...childDragProvided.dragHandleProps}
                                                data-drag-handle
                                                className={styles.dragHandle}
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <GripVertical size={14} />
                                              </span>
                                              <span className={styles.blockIndex}>
                                                {childIndex + 1}
                                              </span>
                                              <span
                                                className={styles.statusDot}
                                                data-status={child.status}
                                              />
                                              <span className={styles.blockKind}>{child.kind}</span>
                                              {child.status === 'open' && (
                                                <span className={styles.liveBadge}>Live</span>
                                              )}
                                            </div>
                                            {child.responses && child.responses.total > 0 && (
                                              <div className={styles.responseCount}>
                                                {child.responses.total} response
                                                {child.responses.total !== 1 ? 's' : ''}
                                              </div>
                                            )}
                                          </Button>
                                        </li>
                                      )}
                                    </Draggable>
                                  ))}
                                  {childProvided.placeholder}
                                </ul>
                              )}
                            </Droppable>
                          )}
                        </li>
                      )}
                    </Draggable>
                  ))}
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
