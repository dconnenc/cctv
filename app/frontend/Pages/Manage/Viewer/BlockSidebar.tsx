import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

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
}: BlockSidebarProps) {
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
              <li key={block.id} style={{ contentVisibility: 'auto' }}>
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
          <ul className="p-2 space-y-1">
            {flattenedBlocks.map(({ block, isChild }, index) => (
              <li key={block.id} style={{ contentVisibility: 'auto' }}>
                <button
                  className={`relative w-full h-16 px-3 py-2 rounded-md cursor-pointer text-sm text-left text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors flex flex-col justify-center ${
                    selectedBlockId === block.id
                      ? 'bg-[hsl(var(--muted))] ring-2 ring-green-500'
                      : ''
                  } ${block.status === 'hidden' ? 'opacity-50' : ''} ${isChild ? '!ml-6 !w-[calc(100%-1.5rem)] border-l-2 border-[hsl(var(--muted-foreground))]' : ''}`}
                  onClick={() => onSelectBlock(block.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[hsl(var(--muted-foreground))] w-4">
                      {index + 1}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(block.status)}`} />
                    <span className="truncate flex-1">{block.kind}</span>
                    {block.status === 'open' && (
                      <span className="text-[10px] font-bold text-green-500 uppercase">Live</span>
                    )}
                  </div>
                  {block.responses && block.responses.total > 0 && (
                    <div className="ml-6 text-xs text-[hsl(var(--muted-foreground))]">
                      {block.responses.total} response{block.responses.total !== 1 ? 's' : ''}
                    </div>
                  )}
                </button>
              </li>
            ))}
            {!hasBlocks && (
              <li className="px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]">
                No blocks yet
              </li>
            )}
          </ul>
        )}
      </div>
    </aside>
  );
}
