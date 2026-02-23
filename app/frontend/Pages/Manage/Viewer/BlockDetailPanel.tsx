import { MessageSquare, Monitor, Pause, Play, SkipForward, User } from 'lucide-react';

import { Button } from '@cctv/core/Button/Button';
import { Block, BlockKind, Experience, ParticipantSummary } from '@cctv/types';

import FamilyFeudManager from '../../Block/FamilyFeudManager/FamilyFeudManager';
import BlockPreview from '../BlockPreview/BlockPreview';
import ContextView from '../ContextView/ContextView';
import BlockResponsesList from './BlockResponsesList';

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
  viewMode: 'monitor' | 'participant' | 'responses';
  monitorView?: Experience;
  participantView?: Experience;
  impersonatedParticipantId?: string;
  participants: ParticipantSummary[];
  onPresent: (block: Block) => void;
  onStopPresenting: (block: Block) => void;
  onPlayNext: () => void;
  onViewModeChange: (mode: 'monitor' | 'participant' | 'responses') => void;
  onImpersonatedParticipantChange: (id: string) => void;
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
}: BlockDetailPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{selectedBlock.kind}</h2>
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
                onClick={() => onStopPresenting(selectedBlock)}
                loading={busyBlockId === selectedBlock.id}
                loadingText="Stopping..."
              >
                <span className="flex items-center gap-2">
                  <Pause size={16} /> <span>Stop Presenting</span>
                </span>
              </Button>
              <Button
                onClick={onPlayNext}
                loading={busyBlockId === selectedBlock.id}
                loadingText="Next..."
              >
                <span className="flex items-center gap-2">
                  <SkipForward size={16} /> <span>Play Next</span>
                </span>
              </Button>
            </>
          ) : (
            <Button
              onClick={() => onPresent(selectedBlock)}
              loading={busyBlockId === selectedBlock.id}
              loadingText="Starting..."
            >
              <span className="flex items-center gap-2">
                <Play size={16} />
                <span>Present</span>
              </span>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div
            role="group"
            aria-label="Preview mode"
            className="flex items-center gap-1 p-1 bg-[hsl(var(--muted))] rounded-lg"
          >
            <button
              onClick={() => onViewModeChange('monitor')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === 'monitor'
                  ? 'bg-[hsl(var(--background))] text-white'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-white'
              }`}
            >
              <Monitor size={14} />
              Monitor
            </button>
            <button
              onClick={() => onViewModeChange('participant')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === 'participant'
                  ? 'bg-[hsl(var(--background))] text-white'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-white'
              }`}
            >
              <User size={14} />
              Participant
            </button>
            <button
              onClick={() => onViewModeChange('responses')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === 'responses'
                  ? 'bg-[hsl(var(--background))] text-white'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-white'
              }`}
            >
              <MessageSquare size={14} />
              Responses ({selectedBlock?.responses?.total ?? 0})
            </button>
          </div>

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
        </div>

        {selectedBlock.kind === BlockKind.FAMILY_FEUD &&
          selectedBlock.payload?.game_state?.phase === 'playing' && (
            <div className="mb-6">
              <FamilyFeudManager block={selectedBlock} />
            </div>
          )}

        <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
            <span className="text-sm font-medium text-white">
              {viewMode === 'monitor'
                ? 'Monitor Preview'
                : viewMode === 'participant'
                  ? 'Participant Preview'
                  : `All Responses (${selectedBlock?.responses?.total ?? 0})`}
            </span>
          </div>
          <div className="p-4 bg-[hsl(var(--card))]">
            {viewMode === 'responses' ? (
              <BlockResponsesList block={selectedBlock} participants={participants} />
            ) : selectedBlock.id === currentOpenBlock?.id ? (
              <ContextView
                block={
                  viewMode === 'monitor'
                    ? (monitorView?.next_block ?? undefined)
                    : (participantView?.next_block ?? undefined)
                }
                participant={
                  viewMode === 'participant'
                    ? participants.find((p) => p.id === impersonatedParticipantId)
                    : undefined
                }
                emptyMessage={
                  viewMode === 'monitor' ? 'No block on Monitor' : 'No block for participant'
                }
                monitorView={monitorView}
                viewMode={viewMode}
                title="Current"
              />
            ) : (
              <BlockPreview
                block={selectedBlock}
                participant={
                  viewMode === 'participant'
                    ? participants.find((p) => p.id === impersonatedParticipantId)
                    : undefined
                }
              />
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
          <div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
              Visible to Segments
            </div>
            <div className="text-sm text-white">
              {selectedBlock.visible_to_segments?.length
                ? selectedBlock.visible_to_segments.join(', ')
                : 'All'}
            </div>
          </div>
          <div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
              Targeted Users
            </div>
            <div className="text-sm text-white">{selectedBlock.target_user_ids?.length ?? 0}</div>
          </div>
        </div>
      </div>

      {selectedBlock.kind === BlockKind.FAMILY_FEUD &&
        selectedBlock.payload?.game_state?.phase !== 'playing' && (
          <div className="mt-6 border-t border-[hsl(var(--border))] pt-6">
            <FamilyFeudManager block={selectedBlock} />
          </div>
        )}
    </div>
  );
}
