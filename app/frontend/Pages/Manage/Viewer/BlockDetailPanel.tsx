import { useState } from 'react';

import { Trash2 } from 'lucide-react';

import { Button } from '@cctv/core/Button/Button';
import { BLOCK_KIND_LABELS, Block, BlockKind, Experience, ParticipantSummary } from '@cctv/types';

import BlockPreview from '../BlockPreview/BlockPreview';
import ContextView from '../ContextView/ContextView';
import BlockContextTab from './BlockContextTab';
import { VisibilityDetails, hasTargetingRules } from './BlockVisibility';

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
  viewMode: 'monitor' | 'participant' | 'block';
  monitorView?: Experience;
  participantView?: Experience;
  impersonatedParticipantId?: string;
  participants: ParticipantSummary[];
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
  viewMode,
  monitorView,
  participantView,
  impersonatedParticipantId,
  participants,
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            {BLOCK_KIND_LABELS[selectedBlock.kind]}
          </span>
          <span className="text-[hsl(var(--muted-foreground))]">·</span>
          <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedBlock.status)}`} />
          <span className="text-sm text-[hsl(var(--muted-foreground))] capitalize">
            {selectedBlock.status}
          </span>
          {hasTargetingRules(selectedBlock) && <VisibilityDetails block={selectedBlock} />}
        </div>
        <div className="flex items-center gap-2">
          {!selectedBlock.parent_block_id && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(selectedBlock)}>
              Edit
            </Button>
          )}
          {selectedBlock.parent_block_id && onDetach && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDetach(selectedBlock)}
              disabled={isDetaching}
            >
              {isDetaching ? 'Detaching...' : 'Detach'}
            </Button>
          )}
          {confirmingDelete ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDelete(selectedBlock);
                  setConfirmingDelete(false);
                }}
              >
                <Trash2 size={14} />
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
              disabled={!canDelete}
              title={canDelete ? undefined : 'Stop presenting before deleting'}
            >
              <Trash2 size={14} />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
        <fieldset aria-label="Preview mode" className="flex border-b border-[hsl(var(--border))]">
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={viewMode === 'monitor' || viewMode === 'participant'}
            className={`rounded-none border-b-2 ${
              viewMode === 'monitor' || viewMode === 'participant'
                ? 'border-[var(--phosphor)] text-[var(--phosphor)]'
                : 'border-transparent text-[hsl(var(--muted-foreground))]'
            }`}
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
            className={`rounded-none border-b-2 ${
              viewMode === 'block'
                ? 'border-[var(--phosphor)] text-[var(--phosphor)]'
                : 'border-transparent text-[hsl(var(--muted-foreground))]'
            }`}
            onClick={() => onViewModeChange('block')}
          >
            Block
          </Button>
          <div className="ml-auto flex items-center gap-1 pr-2">
            {(viewMode === 'monitor' || viewMode === 'participant') && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-pressed={viewMode === 'monitor'}
                  className={`rounded-none border-b-2 ${
                    viewMode === 'monitor'
                      ? 'border-[var(--phosphor)] text-[var(--phosphor)]'
                      : 'border-transparent text-[hsl(var(--muted-foreground))]'
                  }`}
                  onClick={() => onViewModeChange('monitor')}
                >
                  Monitor
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-pressed={viewMode === 'participant'}
                  className={`rounded-none border-b-2 ${
                    viewMode === 'participant'
                      ? 'border-[var(--phosphor)] text-[var(--phosphor)]'
                      : 'border-transparent text-[hsl(var(--muted-foreground))]'
                  }`}
                  onClick={() => onViewModeChange('participant')}
                >
                  Participant
                </Button>
                {viewMode === 'participant' && (
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
                )}
              </>
            )}
          </div>
        </fieldset>

        <div className="p-4 bg-[hsl(var(--card))] min-h-[420px]">
          {viewMode === 'block' ? (
            <BlockContextTab block={selectedBlock} participants={participants} />
          ) : viewMode === 'participant' ? (
            <>
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
            </>
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
      </div>
    </div>
  );
}
