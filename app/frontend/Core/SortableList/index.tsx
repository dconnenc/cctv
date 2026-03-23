import { type ReactNode } from 'react';

import {
  DragDropContext,
  Draggable,
  type DraggableProvidedDragHandleProps,
  type DropResult,
  Droppable,
} from '@hello-pangea/dnd';

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  renderItem: (
    item: T,
    dragHandleProps: DraggableProvidedDragHandleProps | null,
    isDragging: boolean,
  ) => ReactNode;
  as?: 'ul' | 'ol';
  className?: string;
  droppableId: string;
  getAriaLabel?: (item: T, index: number) => string;
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  as: Tag = 'ul',
  className,
  droppableId,
  getAriaLabel,
}: SortableListProps<T>) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    onReorder(result.source.index, result.destination.index);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <Tag ref={provided.innerRef} {...provided.droppableProps} className={className}>
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(dragProvided, snapshot) => (
                  <li
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    aria-label={getAriaLabel ? getAriaLabel(item, index) : undefined}
                  >
                    {renderItem(item, dragProvided.dragHandleProps, snapshot.isDragging)}
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Tag>
        )}
      </Droppable>
    </DragDropContext>
  );
}
