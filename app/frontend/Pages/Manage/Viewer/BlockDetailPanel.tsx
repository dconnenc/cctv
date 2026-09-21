import { useState } from 'react';

import classNames from 'classnames';
import { Trash2 } from 'lucide-react';

import { Button } from '@cctv/core/Button/Button';
import { BLOCK_KIND_LABELS, Block, BlockKind, ParticipantSummary } from '@cctv/types';

import BlockPreview from '../BlockPreview/BlockPreview';
import BlockContextTab, { MetadataRow } from './BlockContextTab';
import { VisibilityDetails, hasTargetingRules } from './BlockVisibility';
import styles from './BlockDetailPanel.module.scss';

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
  viewMode: 'monitor' | 'participant' | 'block';
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
  viewMode,
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
        <div className={styles.tabBar}>
          <button
            className={classNames(styles.tab, { [styles.selected]: viewMode !== 'block' })}
            onClick={() => { if (viewMode === 'block') onViewModeChange('monitor'); }}
          >
            Screens
          </button>
          <button
            className={classNames(styles.tab, { [styles.selected]: viewMode === 'block' })}
            onClick={() => onViewModeChange('block')}
          >
            Block
          </button>
        </div>

        <div className={styles.subNav}>
          {viewMode === 'block' ? (
            <div className={styles.subNavMeta}>
              <MetadataRow block={selectedBlock} />
            </div>
          ) : (
            <>
              <button
                className={classNames(styles.tab, { [styles.selected]: viewMode === 'monitor' })}
                onClick={() => onViewModeChange('monitor')}
              >
                Monitor
              </button>
              <button
                className={classNames(styles.tab, { [styles.selected]: viewMode === 'participant' })}
                onClick={() => onViewModeChange('participant')}
              >
                Participant
              </button>
              {viewMode === 'participant' && (
                <select
                  aria-label="View as participant"
                  value={impersonatedParticipantId || ''}
                  onChange={(e) => onImpersonatedParticipantChange(e.target.value)}
                  className="ml-2 px-3 py-1 text-sm rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-white"
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

        <div className="p-4 bg-[hsl(var(--card))] min-h-[420px]">
          {viewMode === 'block' ? (
            <BlockContextTab block={selectedBlock} participants={participants} />
          ) : viewMode === 'participant' ? (
            <BlockPreview
              block={selectedBlock}
              participant={participants.find((p) => p.id === impersonatedParticipantId)}
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
