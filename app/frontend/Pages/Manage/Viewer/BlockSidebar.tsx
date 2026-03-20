import { DragDropContext, Draggable, type DropResult, Droppable } from '@hello-pangea/dnd';
import { ChevronLeft, ChevronRight, GripVertical, Plus } from 'lucide-react';

import { Block } from '@cctv/types';

interface FlatBlock {
  block: Block;
  isChild: boolean;
  parentId?: string;
}

interface BlockSidebarProps {
  flattenedBlocks: FlatBlock[];
  selectedBlockId: string | null;
  sidebarCollapsed: boolean;
  hasBlocks: boolean;
  onSelectBlock: (id: string) => void;
  onToggleSidebar: () => void;
  onCreateBlock: () => void;
  onReorderBlock?: (blockId: string, newIndex: number) => void;
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
  flattenedBlocks,
  selectedBlockId,
  sidebarCollapsed,
  hasBlocks,
  onSelectBlock,
  onToggleSidebar,
  onCreateBlock,
  onReorderBlock,
}: BlockSidebarProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorderBlock) return;
    if (result.source.index === result.destination.index) return;

    const draggedItem = flattenedBlocks[result.source.index];

    // Don't allow reordering child blocks (they're tied to their parent)
    if (draggedItem.isChild) return;

    // Calculate the new position among parent blocks only
    // We need to map from flattenedBlocks index to parent-only index
    const parentBlocks = flattenedBlocks.filter((fb) => !fb.isChild);
    const oldParentIndex = parentBlocks.findIndex((fb) => fb.block.id === draggedItem.block.id);

    // Find what parent index the destination corresponds to
    const destItem = flattenedBlocks[result.destination.index];
    let newParentIndex: number;
    if (destItem.isChild) {
      // Dropped onto a child — find its parent's index
      newParentIndex = parentBlocks.findIndex((fb) => fb.block.id === destItem.parentId);
    } else {
      newParentIndex = parentBlocks.findIndex((fb) => fb.block.id === destItem.block.id);
    }

    if (oldParentIndex === newParentIndex || newParentIndex === -1) return;

    onReorderBlock(draggedItem.block.id, newParentIndex);
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
            {flattenedBlocks.map(({ block, isChild }, index) => (
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
            <Droppable droppableId="block-sidebar">
              {(provided) => (
                <ul className="p-2 space-y-1" ref={provided.innerRef} {...provided.droppableProps}>
                  {flattenedBlocks.map(({ block, isChild }, index) => (
                    <Draggable
                      key={block.id}
                      draggableId={block.id}
                      index={index}
                      isDragDisabled={isChild}
                    >
                      {(dragProvided, snapshot) => (
                        <li
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          style={{
                            ...dragProvided.draggableProps.style,
                            contentVisibility: 'auto',
                          }}
                          aria-label={`block ${index + 1}`}
                        >
                          <button
                            className={`relative w-full h-16 px-3 py-2 rounded-md cursor-pointer text-sm text-left text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors flex flex-col justify-center ${
                              selectedBlockId === block.id
                                ? 'bg-[hsl(var(--muted))] ring-2 ring-green-500'
                                : ''
                            } ${block.status === 'hidden' ? 'opacity-50' : ''} ${isChild ? '!ml-6 !w-[calc(100%-1.5rem)] border-l-2 border-[hsl(var(--muted-foreground))]' : ''} ${
                              snapshot.isDragging
                                ? 'bg-[hsl(var(--muted))] ring-2 ring-[hsl(var(--primary))] shadow-lg'
                                : ''
                            }`}
                            onClick={() => onSelectBlock(block.id)}
                          >
                            <div className="flex items-center gap-2">
                              {!isChild && (
                                <span
                                  {...dragProvided.dragHandleProps}
                                  className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] cursor-grab active:cursor-grabbing"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical size={14} />
                                </span>
                              )}
                              <span className="text-xs text-[hsl(var(--muted-foreground))] w-4">
                                {index + 1}
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
