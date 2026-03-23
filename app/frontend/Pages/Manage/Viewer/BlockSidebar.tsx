import { useEffect, useState } from 'react';

import { DragDropContext, Draggable, type DropResult, Droppable } from '@hello-pangea/dnd';
import { ChevronLeft, ChevronRight, GripVertical, Plus } from 'lucide-react';

import { Block } from '@cctv/types';

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

function getStatusColor(status: string) {
  switch (status) {
    case 'open':
      return 'bg-green-500';
    case 'closed':
      return 'bg-gray-400';
    case 'hidden':
      return 'bg-gray-600';
    default:
      return 'bg-gray-400';
  }
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

  const flatBlocks = localBlocks.flatMap((b) => [
    { block: b, isChild: false },
    ...(b.children || []).map((c) => ({ block: c, isChild: true })),
  ]);

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
      className={`z-10 h-full shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-12' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between p-2 h-20 border-b border-[hsl(var(--border))]">
        {!sidebarCollapsed && <div className="text-sm text-white font-semibold pl-2">Blocks</div>}
        <div className={`flex items-center gap-1 ${sidebarCollapsed ? 'flex-col' : ''}`}>
          {!sidebarCollapsed && (
            <button
              onClick={onCreateBlock}
              className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] transition-colors"
              title="Create Block"
            >
              <Plus size={16} />
            </button>
          )}
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sidebarCollapsed ? (
          <ul className="p-1 space-y-1">
            {flatBlocks.map(({ block, isChild }, index) => (
              <li
                key={block.id}
                style={{ contentVisibility: 'auto' }}
                aria-label={`block ${index + 1}`}
              >
                <button
                  className={`relative w-full h-10 flex items-center justify-center rounded-md cursor-pointer text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors ${
                    selectedBlockId === block.id
                      ? 'bg-[hsl(var(--muted))] ring-2 ring-green-500'
                      : ''
                  } ${block.status === 'hidden' ? 'opacity-50' : ''}`}
                  onClick={() => onSelectBlock(block.id)}
                  title={`${isChild ? '↳ ' : ''}${block.kind} - ${block.status}`}
                >
                  <span
                    className={`flex items-center justify-center gap-2 w-4 h-4 rounded-full ${getStatusColor(block.status)}`}
                  >
                    <span className="sr-only">
                      {block.kind} - {block.status}
                    </span>
                    <span className="text-xs text-white w-4 z-10">{index + 1}</span>
                  </span>
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={onCreateBlock}
                className="h-10 w-10 !p-0 flex items-center justify-center rounded-md hover:bg-[hsl(var(--muted))] transition-colors"
                title="Create Block"
              >
                <Plus size={32} />
              </button>
            </li>
          </ul>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="top-level" type="PARENT">
              {(provided) => (
                <ul className="p-2 space-y-1" ref={provided.innerRef} {...provided.droppableProps}>
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
                          <button
                            className={`relative w-full h-16 px-3 py-2 rounded-md cursor-pointer text-sm text-left text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors flex flex-col justify-center ${
                              selectedBlockId === block.id
                                ? 'bg-[hsl(var(--muted))] ring-2 ring-green-500'
                                : ''
                            } ${block.status === 'hidden' ? 'opacity-50' : ''} ${
                              snapshot.isDragging
                                ? 'bg-[hsl(var(--muted))] ring-2 ring-[hsl(var(--primary))] shadow-lg'
                                : ''
                            }`}
                            onClick={() => onSelectBlock(block.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                {...dragProvided.dragHandleProps}
                                data-drag-handle
                                className="p-1.5 -ml-1.5 flex items-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] cursor-grab active:cursor-grabbing"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <GripVertical size={14} />
                              </span>
                              <span className="text-xs text-[hsl(var(--muted-foreground))] w-4">
                                {parentIndex + 1}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full ${getStatusColor(block.status)}`}
                              />
                              <span className="truncate flex-1">{block.kind}</span>
                              {block.status === 'open' && (
                                <span className="text-[10px] font-bold text-green-500 uppercase">
                                  Live
                                </span>
                              )}
                            </div>
                            {block.responses && block.responses.total > 0 && (
                              <div className="ml-6 text-xs text-[hsl(var(--muted-foreground))]">
                                {block.responses.total} response
                                {block.responses.total !== 1 ? 's' : ''}
                              </div>
                            )}
                          </button>

                          {block.children && block.children.length > 0 && (
                            <Droppable droppableId={`children-${block.id}`} type="CHILD">
                              {(childProvided) => (
                                <ul
                                  ref={childProvided.innerRef}
                                  {...childProvided.droppableProps}
                                  className="mt-1 space-y-1"
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
                                          className="ml-4"
                                        >
                                          <button
                                            className={`relative w-full h-16 px-3 py-2 rounded-md cursor-pointer text-sm text-left text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors flex flex-col justify-center ${
                                              selectedBlockId === child.id
                                                ? 'bg-[hsl(var(--muted))] ring-2 ring-green-500'
                                                : ''
                                            } ${child.status === 'hidden' ? 'opacity-50' : ''} ${
                                              childSnapshot.isDragging
                                                ? 'bg-[hsl(var(--muted))] ring-2 ring-[hsl(var(--primary))] shadow-lg'
                                                : ''
                                            }`}
                                            onClick={() => onSelectBlock(child.id)}
                                          >
                                            <div className="flex items-center gap-2">
                                              <span
                                                {...childDragProvided.dragHandleProps}
                                                data-drag-handle
                                                className="p-1.5 -ml-1.5 flex items-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] cursor-grab active:cursor-grabbing"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <GripVertical size={14} />
                                              </span>
                                              <span className="text-xs text-[hsl(var(--muted-foreground))] w-4">
                                                {childIndex + 1}
                                              </span>
                                              <span
                                                className={`w-2 h-2 rounded-full ${getStatusColor(child.status)}`}
                                              />
                                              <span className="truncate flex-1">{child.kind}</span>
                                              {child.status === 'open' && (
                                                <span className="text-[10px] font-bold text-green-500 uppercase">
                                                  Live
                                                </span>
                                              )}
                                            </div>
                                            {child.responses && child.responses.total > 0 && (
                                              <div className="ml-6 text-xs text-[hsl(var(--muted-foreground))]">
                                                {child.responses.total} response
                                                {child.responses.total !== 1 ? 's' : ''}
                                              </div>
                                            )}
                                          </button>
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
                  {!hasBlocks && (
                    <li className="px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]">
                      No blocks yet
                    </li>
                  )}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </aside>
  );
}
