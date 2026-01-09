import { useCallback, useEffect, useMemo, useState } from 'react';

import { Link } from 'react-router-dom';

import {
  Bug,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Monitor,
  Pause,
  Play,
  Plus,
  SkipForward,
  User,
  X,
} from 'lucide-react';

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
import ContextView from '../ContextView/ContextView';
import CreateBlock from '../CreateBlock/CreateBlock';
import ParticipantsTab from '../ParticipantsTab/ParticipantsTab';
import DebugPanel from './DebugPanel/DebugPanel';

export default function ManageViewer() {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showParticipantDetails, setShowParticipantDetails] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [busyBlockId, setBusyBlockId] = useState<string>();
  const [dismissedError, setDismissedError] = useState(false);
  const [viewMode, setViewMode] = useState<'monitor' | 'participant' | 'responses'>('monitor');
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
    monitorView,
    participantView,
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

  const flattenedBlocks = useMemo(() => {
    const result: { block: Block; isChild: boolean; parentId?: string }[] = [];
    for (const block of experience?.blocks || []) {
      result.push({ block, isChild: false });
      if (block.children && block.children.length > 0) {
        for (const child of block.children) {
          result.push({ block: child, isChild: true, parentId: block.id });
        }
      }
    }
    return result;
  }, [experience]);

  const currentOpenBlock = useMemo(() => {
    return flattenedBlocks.find(({ block }) => block.status === 'open')?.block;
  }, [flattenedBlocks]);

  const selectedBlock = useMemo(() => {
    return flattenedBlocks.find(({ block }) => block.id === selectedBlockId)?.block;
  }, [flattenedBlocks, selectedBlockId]);

  // Helper to find parent block for a child block
  const findParentBlock = useCallback(
    (childBlock: Block): Block | undefined => {
      if (!experience || !childBlock.parent_block_ids?.length) return undefined;
      const parentId = childBlock.parent_block_ids[0];
      return experience.blocks.find((b) => b.id === parentId);
    },
    [experience],
  );

  const handlePresent = useCallback(
    async (block: Block) => {
      if (!code) return;

      setBusyBlockId(block.id);
      setStatusError(null);

      // Check if this is a child block (has parent)
      const parentBlock = findParentBlock(block);

      if (parentBlock) {
        // This is a child block - ensure parent is open first
        if (parentBlock.status !== 'open') {
          await changeStatus(parentBlock, 'open');
        }

        // Close any other open children of the same parent (only one child can be active)
        const openSiblings =
          parentBlock.children?.filter((c) => c.id !== block.id && c.status === 'open') || [];
        for (const sibling of openSiblings) {
          await changeStatus(sibling, 'closed');
        }

        // Open the target child block
        if (block.status !== 'open') {
          await changeStatus(block, 'open');
        }
      } else if (block.children?.length) {
        // This is a parent block with children
        // First, close any other open parent blocks and their children
        const otherOpenParents =
          experience?.blocks?.filter(
            (b) => b.id !== block.id && b.status === 'open' && !b.parent_block_ids?.length,
          ) || [];

        for (const otherParent of otherOpenParents) {
          // Close children first
          if (otherParent.children) {
            for (const child of otherParent.children) {
              if (child.status === 'open') {
                await changeStatus(child, 'closed');
              }
            }
          }
          // Close the parent
          await changeStatus(otherParent, 'closed');
        }

        // Open the parent block
        if (block.status !== 'open') {
          await changeStatus(block, 'open');
        }

        // Open the first child
        const firstChild = block.children[0];
        if (firstChild && firstChild.status !== 'open') {
          await changeStatus(firstChild, 'open');
        }
      } else {
        // Simple block with no parent/children
        // Close all open blocks first
        const openBlocks = experience?.blocks?.filter((b) => b.status === 'open') || [];
        for (const openBlock of openBlocks) {
          if (openBlock.id !== block.id) {
            // If it's a parent with children, close children first
            if (openBlock.children) {
              for (const child of openBlock.children) {
                if (child.status === 'open') {
                  await changeStatus(child, 'closed');
                }
              }
            }
            await changeStatus(openBlock, 'closed');
          }
        }

        // Open the block
        if (block.status !== 'open') {
          await changeStatus(block, 'open');
        }
      }

      setBusyBlockId(undefined);
    },
    [code, experience, changeStatus, setStatusError, findParentBlock],
  );

  const handleStopPresenting = useCallback(
    async (block: Block) => {
      if (!code) return;

      setBusyBlockId(block.id);
      setStatusError(null);

      // Check if this is a child block
      const parentBlock = findParentBlock(block);

      if (parentBlock) {
        // This is a child block - close the child, then close the parent
        await changeStatus(block, 'closed');
        // Also close the parent when stopping a child
        if (parentBlock.status === 'open') {
          await changeStatus(parentBlock, 'closed');
        }
      } else if (block.children?.length) {
        // This is a parent block - close all children first, then close parent
        for (const child of block.children) {
          if (child.status === 'open') {
            await changeStatus(child, 'closed');
          }
        }
        await changeStatus(block, 'closed');
      } else {
        // Simple block - just close it
        await changeStatus(block, 'closed');
      }

      setBusyBlockId(undefined);
    },
    [code, changeStatus, setStatusError, findParentBlock],
  );

  const handlePlayNext = useCallback(async () => {
    if (!code || !selectedBlock) return;

    const currentIndex = flattenedBlocks.findIndex(({ block }) => block.id === selectedBlock.id);
    if (currentIndex === -1 || currentIndex >= flattenedBlocks.length - 1) return;

    const nextBlock = flattenedBlocks[currentIndex + 1].block;

    // Check if we're moving to a different parent
    const currentParent = findParentBlock(selectedBlock);
    const nextParent = findParentBlock(nextBlock);

    setBusyBlockId(selectedBlock.id);
    setStatusError(null);

    // If next block has the same parent as current, just switch children
    if (currentParent && nextParent && currentParent.id === nextParent.id) {
      // Close current child
      if (selectedBlock.status === 'open') {
        await changeStatus(selectedBlock, 'closed');
      }
      // Open next child
      if (nextBlock.status !== 'open') {
        await changeStatus(nextBlock, 'open');
      }
    } else {
      // Different parents or moving between parent/child - use full handlePresent logic
      // Close current block properly (with parent/children handling)
      const currentBlockParent = findParentBlock(selectedBlock);
      if (currentBlockParent) {
        // Current is a child - close it and parent
        if (selectedBlock.status === 'open') {
          await changeStatus(selectedBlock, 'closed');
        }
        if (currentBlockParent.status === 'open') {
          await changeStatus(currentBlockParent, 'closed');
        }
      } else if (selectedBlock.children?.length) {
        // Current is a parent - close children first
        for (const child of selectedBlock.children) {
          if (child.status === 'open') {
            await changeStatus(child, 'closed');
          }
        }
        if (selectedBlock.status === 'open') {
          await changeStatus(selectedBlock, 'closed');
        }
      } else if (selectedBlock.status === 'open') {
        await changeStatus(selectedBlock, 'closed');
      }

      // Open next block with proper parent/child handling
      const nextBlockParent = findParentBlock(nextBlock);
      if (nextBlockParent) {
        // Next is a child - open parent first, then child
        if (nextBlockParent.status !== 'open') {
          await changeStatus(nextBlockParent, 'open');
        }
        if (nextBlock.status !== 'open') {
          await changeStatus(nextBlock, 'open');
        }
      } else if (nextBlock.children?.length) {
        // Next is a parent - open it and first child
        if (nextBlock.status !== 'open') {
          await changeStatus(nextBlock, 'open');
        }
        const firstChild = nextBlock.children[0];
        if (firstChild && firstChild.status !== 'open') {
          await changeStatus(firstChild, 'open');
        }
      } else {
        // Simple block
        if (nextBlock.status !== 'open') {
          await changeStatus(nextBlock, 'open');
        }
      }
    }

    setSelectedBlockId(nextBlock.id);
    setBusyBlockId(undefined);
  }, [code, selectedBlock, flattenedBlocks, changeStatus, setStatusError, findParentBlock]);

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
                {flattenedBlocks.map(({ block, isChild }, index) => (
                  <li key={block.id}>
                    <button
                      className={`relative w-full h-10 flex items-center justify-center rounded-md cursor-pointer text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors ${
                        selectedBlockId === block.id
                          ? 'bg-[hsl(var(--muted))] ring-2 ring-green-500'
                          : ''
                      } ${block.status === 'hidden' ? 'opacity-50' : ''}`}
                      onClick={() => setSelectedBlockId(block.id)}
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
                {flattenedBlocks.map(({ block, isChild }, index) => (
                  <li key={block.id}>
                    <button
                      className={`relative w-full h-16 px-3 py-2 rounded-md cursor-pointer text-sm text-left text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors flex flex-col justify-center ${
                        selectedBlockId === block.id
                          ? 'bg-[hsl(var(--muted))] ring-2 ring-green-500'
                          : ''
                      } ${block.status === 'hidden' ? 'opacity-50' : ''} ${isChild ? '!ml-6 !w-[calc(100%-1.5rem)] border-l-2 border-[hsl(var(--muted-foreground))]' : ''}`}
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
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  showDebugPanel
                    ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500'
                    : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
                }`}
                title="Debug Panel"
              >
                <Bug size={16} />
              </button>
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
                  <div className="flex items-center gap-2">
                    {selectedBlock.status === 'open' ? (
                      <>
                        <Button
                          onClick={() => handleStopPresenting(selectedBlock)}
                          loading={busyBlockId === selectedBlock.id}
                          loadingText="Stopping..."
                        >
                          <span className="flex items-center gap-2">
                            <Pause size={16} /> <span>Stop Presenting</span>
                          </span>
                        </Button>
                        <Button
                          onClick={handlePlayNext}
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
                      <button
                        onClick={() => setViewMode('responses')}
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

                  {/* Family Feud Playing Controls - shown above preview when in playing mode */}
                  {selectedBlock.kind === BlockKind.FAMILY_FEUD &&
                    (selectedBlock.payload as any)?.game_state?.phase === 'playing' && (
                      <div className="mb-6">
                        <FamilyFeudManager block={selectedBlock} />
                      </div>
                    )}

                  {/* Block Preview or Responses */}
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
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {(() => {
                            const responses = selectedBlock?.responses as
                              | {
                                  all_responses?: Array<{
                                    id: string;
                                    user_id: string;
                                    answer: unknown;
                                    created_at: string;
                                  }>;
                                }
                              | undefined;
                            const allResponses = responses?.all_responses;
                            if (allResponses && allResponses.length > 0) {
                              return allResponses.map((response, index) => {
                                const participant = participantsCombined.find(
                                  (p) => p.user_id === response.user_id,
                                );
                                return (
                                  <div
                                    key={response.id}
                                    className="p-3 bg-[hsl(var(--background))] rounded-md border border-[hsl(var(--border))]"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                        #{index + 1} • {participant?.name || 'Unknown'}
                                      </span>
                                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                        {new Date(response.created_at).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    <div className="text-sm text-white">
                                      {typeof response.answer === 'object'
                                        ? JSON.stringify(response.answer, null, 2)
                                        : String(response.answer)}
                                    </div>
                                  </div>
                                );
                              });
                            }
                            return (
                              <div className="text-center text-[hsl(var(--muted-foreground))] py-8">
                                No responses yet
                              </div>
                            );
                          })()}
                        </div>
                      ) : selectedBlockId === currentOpenBlock?.id ? (
                        <ContextView
                          block={
                            viewMode === 'monitor'
                              ? (monitorView?.next_block ?? undefined)
                              : (participantView?.next_block ?? undefined)
                          }
                          participant={
                            viewMode === 'participant'
                              ? participantsCombined.find((p) => p.id === impersonatedParticipantId)
                              : undefined
                          }
                          emptyMessage={
                            viewMode === 'monitor'
                              ? 'No block on Monitor'
                              : 'No block for participant'
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
                              ? participantsCombined.find((p) => p.id === impersonatedParticipantId)
                              : undefined
                          }
                        />
                      )}
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

                {/* Family Feud Manager for family_feud blocks - moved above preview if playing */}
                {selectedBlock.kind === BlockKind.FAMILY_FEUD &&
                  (selectedBlock.payload as any)?.game_state?.phase !== 'playing' && (
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
          className={`z-10 absolute h-full top-0 right-0 w-[420px] shrink-0 border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col transition-all duration-300 ease-in-out ${
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

      {/* Debug panel */}
      <Dialog open={showDebugPanel} onOpenChange={setShowDebugPanel}>
        <DialogContent className="sm:max-w-2xl w-full">
          <DebugPanel selectedBlock={selectedBlock} />
        </DialogContent>
      </Dialog>
    </>
  );
}
