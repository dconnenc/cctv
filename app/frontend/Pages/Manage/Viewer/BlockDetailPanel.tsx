import { useState } from 'react';

import { ArrowRight, CircleDot, MoreHorizontal, Square, Trash2 } from 'lucide-react';

import { useExperience } from '@cctv/contexts/ExperienceContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cctv/core';
import { Button } from '@cctv/core/Button/Button';
import { SegmentBadge } from '@cctv/core/SegmentBadge/SegmentBadge';
import { BLOCK_KIND_LABELS, Block, BlockKind, Experience, ParticipantSummary } from '@cctv/types';

import BlockPreview from '../BlockPreview/BlockPreview';
import ContextView from '../ContextView/ContextView';
import BlockContextTab from './BlockContextTab';

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

interface BlockDetailPanelProps {
  selectedBlock: Block;
  currentOpenBlock?: Block;
  busyBlockId?: string;
  viewMode: 'monitor' | 'participant' | 'block';
  monitorView?: Experience;
  participantView?: Experience;
  impersonatedParticipantId?: string;
  participants: ParticipantSummary[];
  onPresent: (block: Block) => void;
  onStopPresenting: (block: Block) => void;
  onPlayNext: () => void;
  onViewModeChange: (mode: 'monitor' | 'participant' | 'block') => void;
  onImpersonatedParticipantChange: (id: string) => void;
  onEdit: (block: Block) => void;
  onDetach?: (block: Block) => void;
  detachingBlockId?: string;
  onDelete: (block: Block) => void;
  deletingBlockId?: string;
}

export default function BlockDetailPanel({
  selectedBlock,
  currentOpenBlock,
  busyBlockId,
  viewMode,
  monitorView,
  participantView,
  impersonatedParticipantId,
  participants,
  onPresent,
  onStopPresenting,
  onPlayNext,
  onViewModeChange,
  onImpersonatedParticipantChange,
  onEdit,
  onDetach,
  detachingBlockId,
  onDelete,
  deletingBlockId,
}: BlockDetailPanelProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isDetaching = detachingBlockId === selectedBlock.id;
  const isDeleting = deletingBlockId === selectedBlock.id;
  const canDelete = selectedBlock.status !== 'open';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {BLOCK_KIND_LABELS[selectedBlock.kind]}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedBlock.status)}`} />
            <span className="text-sm text-[hsl(var(--muted-foreground))] capitalize">
              {selectedBlock.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedBlock.status === 'open' ? (
            <>
              <Button
                variant="secondary"
                onClick={() => onStopPresenting(selectedBlock)}
                loading={busyBlockId === selectedBlock.id}
                loadingText="Closing..."
              >
                <Square size={16} />
                <span>Close</span>
              </Button>
              <Button
                onClick={onPlayNext}
                loading={busyBlockId === selectedBlock.id}
                loadingText="Next..."
              >
                <ArrowRight size={16} />
                <span>Next</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={() => onPresent(selectedBlock)}
              loading={busyBlockId === selectedBlock.id}
              loadingText="Opening..."
            >
              <CircleDot size={16} />
              <span>Open</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" title="Block options" aria-label="Block options">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!selectedBlock.parent_block_id && (
                <DropdownMenuItem onSelect={() => onEdit(selectedBlock)}>Edit</DropdownMenuItem>
              )}
              {selectedBlock.parent_block_id && onDetach && (
                <DropdownMenuItem onSelect={() => onDetach(selectedBlock)} disabled={isDetaching}>
                  {isDetaching ? 'Detaching...' : 'Detach'}
                </DropdownMenuItem>
              )}
              {confirmingDelete ? (
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      onDelete(selectedBlock);
                      setConfirmingDelete(false);
                    }}
                  >
                    <Trash2 size={14} />
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setConfirmingDelete(false)}>
                    Cancel
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onSelect={() => setConfirmingDelete(true)} disabled={!canDelete}>
                  <Trash2 size={14} />
                  {canDelete ? 'Delete' : 'Stop presenting before deleting'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
          <fieldset aria-label="Preview mode" className="flex border-b border-[hsl(var(--border))]">
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={viewMode === 'monitor' || viewMode === 'participant'}
              className={
                viewMode === 'monitor' || viewMode === 'participant' ? 'bg-[hsl(var(--muted))]' : ''
              }
              onClick={() => {
                if (viewMode === 'block') onViewModeChange('monitor');
              }}
            >
              Screens
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={viewMode === 'block'}
              className={viewMode === 'block' ? 'bg-[hsl(var(--muted))]' : ''}
              onClick={() => onViewModeChange('block')}
            >
              Block
            </Button>
          </fieldset>

          <div className="p-4 bg-[hsl(var(--card))] min-h-[420px]">
            {viewMode === 'block' ? (
              <BlockContextTab block={selectedBlock} participants={participants} />
            ) : (
              <div className="space-y-3">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-pressed={viewMode === 'monitor'}
                    className={viewMode === 'monitor' ? 'bg-[hsl(var(--muted))]' : ''}
                    onClick={() => onViewModeChange('monitor')}
                  >
                    Monitor
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-pressed={viewMode === 'participant'}
                    className={viewMode === 'participant' ? 'bg-[hsl(var(--muted))]' : ''}
                    onClick={() => onViewModeChange('participant')}
                  >
                    Participant
                  </Button>
                </div>
                {viewMode === 'participant' ? (
                  <div className="space-y-3">
                    <select
                      aria-label="View as participant"
                      value={impersonatedParticipantId || ''}
                      onChange={(e) => onImpersonatedParticipantChange(e.target.value)}
                      className="px-3 py-1.5 text-sm rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-white"
                    >
                      {participants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.role})
                        </option>
                      ))}
                    </select>
                    {selectedBlock.id === currentOpenBlock?.id ? (
                      <ContextView
                        block={participantView?.blocks[0] ?? undefined}
                        participant={participants.find((p) => p.id === impersonatedParticipantId)}
                        emptyMessage="No block for participant"
                        monitorView={monitorView}
                        viewMode="participant"
                        title="Participant"
                      />
                    ) : (
                      <BlockPreview
                        block={selectedBlock}
                        participant={participants.find((p) => p.id === impersonatedParticipantId)}
                      />
                    )}
                  </div>
                ) : selectedBlock.id === currentOpenBlock?.id ? (
                  <ContextView
                    block={undefined}
                    participant={undefined}
                    emptyMessage={
                      selectedBlock.kind === BlockKind.ANNOUNCEMENT &&
                      selectedBlock.payload.show_on_monitor === false
                        ? 'This block is not shown on the monitor'
                        : 'No block on Monitor'
                    }
                    monitorView={monitorView}
                    viewMode="monitor"
                    title="Current"
                  />
                ) : selectedBlock.kind === BlockKind.ANNOUNCEMENT &&
                  selectedBlock.payload.show_on_monitor === false ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    This block is not shown on the monitor
                  </p>
                ) : (
                  <BlockPreview block={selectedBlock} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
              Responses
            </div>
            <div className="text-lg font-semibold text-white">
              {selectedBlock.responses?.total ?? 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
              Visible to Roles
            </div>
            <div className="text-sm text-white">
              {selectedBlock.visible_to_roles?.length
                ? selectedBlock.visible_to_roles.join(', ')
                : 'All'}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <VisibleSegments segments={selectedBlock.visible_to_segments} />
          <div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
              Targeted Users
            </div>
            <div className="text-sm text-white">{selectedBlock.target_user_ids?.length ?? 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisibleSegments({ segments }: { segments?: string[] }) {
  const { experience } = useExperience();
  const definedSegments = experience?.segments || [];

  return (
    <div>
      <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
        Visible to Segments
      </div>
      <div
        className="text-sm text-white mt-1"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}
      >
        {segments?.length
          ? segments.map((name) => {
              const seg = definedSegments.find((s) => s.name === name);
              return <SegmentBadge key={name} name={name} color={seg?.color || '#6B7280'} />;
            })
          : 'All'}
      </div>
    </div>
  );
}
