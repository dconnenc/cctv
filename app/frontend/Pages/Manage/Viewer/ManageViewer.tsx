import { useCallback, useEffect, useMemo, useState } from 'react';

import { Link } from 'react-router-dom';

import { ChevronLeft, ChevronRight, Monitor, Pause, Play, Plus, User, X } from 'lucide-react';

import { Dialog, DialogContent } from '@cctv/components/ui/dialog';
import { useExperience } from '@cctv/contexts';
import { Button, Pill } from '@cctv/core';
import {
  useChangeBlockStatus,
  useExperiencePause,
  useExperienceResume,
  useExperienceStart,
} from '@cctv/hooks';
import { Block, BlockKind, ParticipantSummary } from '@cctv/types';

import FamilyFeudManager from '../../Block/FamilyFeudManager/FamilyFeudManager';
import BlockPreview from '../BlockPreview/BlockPreview';
import CreateBlock from '../CreateBlock/CreateBlock';
import ParticipantsTab from '../ParticipantsTab/ParticipantsTab';

export default function ManageViewer() {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showParticipantDetails, setShowParticipantDetails] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [busyBlockId, setBusyBlockId] = useState<string>();
  const [dismissedError, setDismissedError] = useState(false);
  const [viewMode, setViewMode] = useState<'monitor' | 'participant'>('monitor');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    experience,
    code,
    isLoading,
    error: experienceError,
    impersonatedParticipantId,
    setImpersonatedParticipantId,
  } = useExperience();

  const { startExperience, isLoading: starting, error: startError } = useExperienceStart();
  const { pauseExperience, isLoading: pausing, error: pauseError } = useExperiencePause();
  const { resumeExperience, isLoading: resuming, error: resumeError } = useExperienceResume();

  const participantsCombined: ParticipantSummary[] = useMemo(
    () => [...(experience?.hosts || []), ...(experience?.participants || [])],
    [experience],
  );

  useEffect(() => {
    if (participantsCombined.length > 0 && !impersonatedParticipantId) {
      setImpersonatedParticipantId(participantsCombined[0].id);
    }
  }, [participantsCombined, impersonatedParticipantId, setImpersonatedParticipantId]);

  const {
    change: changeStatus,
    error: statusError,
    setError: setStatusError,
  } = useChangeBlockStatus();

  const selectedBlock = useMemo(() => {
    return experience?.blocks?.find((block) => block.id === selectedBlockId);
  }, [experience, selectedBlockId]);

  const currentOpenBlock = useMemo(() => {
    return experience?.blocks?.find((block) => block.status === 'open');
  }, [experience]);

  const handlePresent = useCallback(
    async (block: Block) => {
      if (!code) return;

      setBusyBlockId(block.id);
      setStatusError(null);

      const openBlocks = experience?.blocks?.filter((b) => b.status === 'open') || [];
      for (const openBlock of openBlocks) {
        if (openBlock.id !== block.id) {
          await changeStatus(openBlock, 'closed');
        }
      }

      if (block.status !== 'open') {
        await changeStatus(block, 'open');
      }

      setBusyBlockId(undefined);
    },
    [code, experience, changeStatus, setStatusError],
  );

  const handleStopPresenting = useCallback(
    async (block: Block) => {
      if (!code) return;

      setBusyBlockId(block.id);
      setStatusError(null);

      await changeStatus(block, 'closed');

      setBusyBlockId(undefined);
    },
    [code, changeStatus, setStatusError],
  );

  const handleCreateBlock = () => {
    setIsCreateDialogOpen(true);
  };

  const getExperienceActionButton = () => {
    if (!experience) return null;

    switch (experience.status) {
      case 'draft':
      case 'lobby':
        return (
          <Button onClick={startExperience} loading={starting} loadingText="Starting...">
            <Play size={16} />
            <span>Start</span>
          </Button>
        );
      case 'live':
        return (
          <Button onClick={pauseExperience} loading={pausing} loadingText="Pausing...">
            <Pause size={16} />
            <span>Pause</span>
          </Button>
        );
      case 'paused':
        return (
          <Button onClick={resumeExperience} loading={resuming} loadingText="Resuming...">
            <Play size={16} />
            <span>Resume</span>
          </Button>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
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
  };

  useEffect(() => {
    if (!selectedBlockId) {
      const firstActiveBlock = experience?.blocks?.find((block) => block.status === 'open');

      if (firstActiveBlock) {
        setSelectedBlockId(firstActiveBlock.id);
      }
    }
  }, [experience?.blocks, selectedBlockId]);

  if (isLoading) {
    return <section className="page flex-centered">Loading...</section>;
  }

  const errorMessage =
    !dismissedError && (experienceError || startError || pauseError || resumeError || statusError);
  const statusLabel = experience?.status
    ? experience.status.charAt(0).toUpperCase() + experience.status.slice(1)
    : '';

  return (
    <>
      <section className="flex w-full h-[calc(100dvh-var(--nav-h))] overflow-hidden relative">
        {/* Left sidebar - Block list */}
        <aside
          className={`z-10 h-full shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'w-12' : 'w-64'
          }`}
        >
          <div className="flex items-center justify-between p-2 h-20 border-b border-[hsl(var(--border))]">
            {!sidebarCollapsed && (
              <div className="text-sm text-white font-semibold pl-2">Blocks</div>
            )}
            <div className={`flex items-center gap-1 ${sidebarCollapsed ? 'flex-col' : ''}`}>
              {!sidebarCollapsed && (
                <button
                  onClick={handleCreateBlock}
                  className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] transition-colors"
                  title="Create Block"
                >
                  <Plus size={16} />
                </button>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
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
                {experience?.blocks?.map((block, index) => (
                  <li key={block.id}>
                    <button
                      className={`relative w-full h-10 flex items-center justify-center rounded-md cursor-pointer text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors ${
                        selectedBlockId === block.id
                          ? 'bg-[hsl(var(--muted))] ring-2 ring-green-500'
                          : ''
                      } ${block.status === 'hidden' ? 'opacity-50' : ''}`}
                      onClick={() => setSelectedBlockId(block.id)}
                      title={`${block.kind} - ${block.status}`}
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
                    onClick={handleCreateBlock}
                    className="h-10 w-10 !p-0 flex items-center justify-center rounded-md hover:bg-[hsl(var(--muted))] transition-colors"
                    title="Create Block"
                  >
                    <Plus size={32} />
                  </button>
                </li>
              </ul>
            ) : (
              <ul className="p-2 space-y-1">
                {experience?.blocks?.map((block, index) => (
                  <li key={block.id}>
                    <button
                      className={`relative w-full h-16 px-3 py-2 rounded-md cursor-pointer text-sm text-left text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors flex flex-col justify-center ${
                        selectedBlockId === block.id
                          ? 'bg-[hsl(var(--muted))] ring-2 ring-green-500'
                          : ''
                      } ${block.status === 'hidden' ? 'opacity-50' : ''}`}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[hsl(var(--muted-foreground))] w-4">
                          {index + 1}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(block.status)}`} />
                        <span className="truncate flex-1">{block.kind}</span>
                        {block.status === 'open' && (
                          <span className="text-[10px] font-bold text-green-500 uppercase">
                            Live
                          </span>
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
                {(!experience?.blocks || experience.blocks.length === 0) && (
                  <li className="px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]">
                    No blocks yet
                  </li>
                )}
              </ul>
            )}
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 flex flex-col w-full h-full z-10 overflow-hidden bg-[hsl(var(--background))]">
          {/* Experience header with controls */}
          <div className="flex items-center justify-between p-4 h-20 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold text-white">
                {experience?.name || 'Experience'}
              </div>
              {statusLabel && <Pill label={statusLabel} />}
              <Link className="text-lg text-yellow-500 z-10" to={location.pathname + '/old'}>
                Go to old view
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {getExperienceActionButton()}
              <button
                onClick={() => setShowParticipantDetails(!showParticipantDetails)}
                className="px-3 py-1.5 text-sm rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors"
              >
                {showParticipantDetails ? 'Hide Participants' : 'Participants'}
              </button>
            </div>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div className="mx-4 mt-4 px-4 py-3 bg-red-500/10 border border-red-500 text-red-400 rounded-md flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                onClick={() => setDismissedError(true)}
                className="p-1 hover:bg-red-500/20 rounded"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Block content area */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedBlock ? (
              <div className="space-y-6">
                {/* Block header with present button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{selectedBlock.kind}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`w-2 h-2 rounded-full ${getStatusColor(selectedBlock.status)}`}
                      />
                      <span className="text-sm text-[hsl(var(--muted-foreground))] capitalize">
                        {selectedBlock.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    {selectedBlock.status === 'open' ? (
                      <Button
                        onClick={() => handleStopPresenting(selectedBlock)}
                        loading={busyBlockId === selectedBlock.id}
                        loadingText="Stopping..."
                      >
                        <span className="flex items-center gap-2">
                          <Pause size={16} /> <span> Stop Presenting</span>
                        </span>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePresent(selectedBlock)}
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

                {/* View mode toggle and preview */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 p-1 bg-[hsl(var(--muted))] rounded-lg">
                      <button
                        onClick={() => setViewMode('monitor')}
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
                        onClick={() => setViewMode('participant')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                          viewMode === 'participant'
                            ? 'bg-[hsl(var(--background))] text-white'
                            : 'text-[hsl(var(--muted-foreground))] hover:text-white'
                        }`}
                      >
                        <User size={14} />
                        Participant
                      </button>
                    </div>

                    {viewMode === 'participant' && (
                      <select
                        value={impersonatedParticipantId || ''}
                        onChange={(e) => setImpersonatedParticipantId(e.target.value)}
                        className="px-3 py-1.5 text-sm rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-white"
                      >
                        {participantsCombined.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.role})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Block Preview */}
                  <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                      <span className="text-sm font-medium text-white">
                        {viewMode === 'monitor' ? 'Monitor Preview' : 'Participant Preview'}
                      </span>
                    </div>
                    <div className="p-4 bg-[hsl(var(--card))]">
                      <BlockPreview
                        block={selectedBlock}
                        participant={
                          viewMode === 'participant'
                            ? participantsCombined.find((p) => p.id === impersonatedParticipantId)
                            : undefined
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Block details */}
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
                      <div className="text-sm text-white">
                        {selectedBlock.target_user_ids?.length ?? 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Family Feud Manager for family_feud blocks */}
                {selectedBlock.kind === BlockKind.FAMILY_FEUD && (
                  <div className="mt-6 border-t border-[hsl(var(--border))] pt-6">
                    <FamilyFeudManager block={selectedBlock} />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[hsl(var(--muted-foreground))]">
                Select a block from the sidebar to view details
              </div>
            )}
          </div>
        </main>

        {/* Participants panel - slides in from right */}
        <aside
          className={`z-10 absolute h-full top-0 right-0 w-80 shrink-0 border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col transition-all duration-300 ease-in-out ${
            showParticipantDetails
              ? 'translate-x-0'
              : 'translate-x-full w-0 border-0 overflow-hidden'
          }`}
        >
          <div className="p-4 h-20 border-b border-[hsl(var(--border))] flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Participants</div>
            <button
              onClick={() => setShowParticipantDetails(false)}
              className="p-1 rounded hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ParticipantsTab participants={participantsCombined} />
          </div>
        </aside>
      </section>

      {/* Create block dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-3xl w-full">
          <CreateBlock
            onClose={() => setIsCreateDialogOpen(false)}
            participants={participantsCombined}
            onEndCurrentBlock={async () => {
              if (!currentOpenBlock) return;
              await changeStatus(currentOpenBlock, 'closed');
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
