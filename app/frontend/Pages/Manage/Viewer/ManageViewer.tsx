import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { ArrowRight, ChevronLeft, ChevronRight, CircleDot, Square, X } from 'lucide-react';

import { trackManageAction } from '@cctv/analytics';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Button, Drawer, DrawerBody, DrawerContent } from '@cctv/core';
import { Pill } from '@cctv/core/Pill/Pill';
import { useBlockPresentation } from '@cctv/hooks/useBlockPresentation';
import { useDeleteExperienceBlock } from '@cctv/hooks/useDeleteExperienceBlock';
import { useDetachBlockFromParent } from '@cctv/hooks/useDetachBlockFromParent';
import { useExperiencePause } from '@cctv/hooks/useExperiencePause';
import { useExperienceResume } from '@cctv/hooks/useExperienceResume';
import { useExperienceStart } from '@cctv/hooks/useExperienceStart';
import { useReorderBlock } from '@cctv/hooks/useReorderBlock';
import { BLOCK_KIND_LABELS, Block, ParticipantSummary } from '@cctv/types';

import CreateBlock from '../CreateBlock/CreateBlock';
import EditBlock from '../EditBlock/EditBlock';
import ExperienceActionButton from '../ExperienceActionButton';
import { getManageMode } from '../Focus/useManageMode';
import ParticipantsTab from '../ParticipantsTab/ParticipantsTab';
import BlockDetailPanel from './BlockDetailPanel';
import BlockSidebar from './BlockSidebar';

function getBlockStatusColor(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-green-500';
    case 'closed':
      return 'bg-gray-400';
    default:
      return 'bg-gray-600';
  }
}

export default function ManageViewer() {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showParticipantDetails, setShowParticipantDetails] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [dismissedError, setDismissedError] = useState(false);
  const [viewMode, setViewMode] = useState<'monitor' | 'participant' | 'block'>('block');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => 'window' in globalThis && window.innerWidth < 768,
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigate = useNavigate();
  const redirectedRef = useRef(false);

  const {
    experience,
    code,
    error: experienceError,
    isLoading,
    wsReady,
    impersonatedParticipantId,
    setImpersonatedParticipantId,
    monitorView,
    participantView,
  } = useExperience();

  const { error: startError } = useExperienceStart();
  const { error: pauseError } = useExperiencePause();
  const { error: resumeError } = useExperienceResume();

  const {
    handlePresent,
    handleStopPresenting,
    handlePlayNext,
    closeBlock,
    busyBlockId,
    statusError,
  } = useBlockPresentation();

  useEffect(() => {
    if (redirectedRef.current || !code) return;
    redirectedRef.current = true;
    if (getManageMode() === 'focus') {
      navigate(`/experiences/${code}/manage/focus`, { replace: true });
    }
  }, [code, navigate]);

  const { reorder: reorderBlock } = useReorderBlock();
  const { detach: detachFromParent, error: detachError } = useDetachBlockFromParent();
  const [detachingBlockId, setDetachingBlockId] = useState<string | undefined>();

  const handleDetachBlock = useCallback(
    async (block: Block) => {
      trackManageAction('detach_block', { block_id: block.id, block_kind: block.kind });
      setDetachingBlockId(block.id);
      await detachFromParent(block.id);
      setDetachingBlockId(undefined);
    },
    [detachFromParent],
  );

  const { deleteBlock, error: deleteError } = useDeleteExperienceBlock();
  const [deletingBlockId, setDeletingBlockId] = useState<string | undefined>();

  const handleDeleteBlock = useCallback(
    async (block: Block) => {
      trackManageAction('delete_block', { block_id: block.id, block_kind: block.kind });
      setDeletingBlockId(block.id);
      const result = await deleteBlock(block.id);
      setDeletingBlockId(undefined);
      if (result.success && selectedBlockId === block.id) {
        setSelectedBlockId(null);
      }
    },
    [deleteBlock, selectedBlockId],
  );

  const handleReorderBlock = useCallback(
    (blockId: string, newIndex: number) => {
      trackManageAction('reorder_block', { block_id: blockId, new_index: newIndex });
      reorderBlock(blockId, newIndex);
    },
    [reorderBlock],
  );

  const participantsCombined: ParticipantSummary[] = useMemo(
    () => [...(experience?.hosts || []), ...(experience?.participants || [])],
    [experience],
  );

  useEffect(() => {
    if (participantsCombined.length > 0 && !impersonatedParticipantId) {
      setImpersonatedParticipantId(participantsCombined[0].id);
    }
  }, [participantsCombined, impersonatedParticipantId, setImpersonatedParticipantId]);

  const flattenedBlocks = useMemo(() => {
    return (experience?.blocks || []).map((block) => ({
      block,
      isChild: Boolean(block.parent_block_id),
      parentId: block.parent_block_id ?? undefined,
    }));
  }, [experience]);

  const currentOpenBlock = useMemo(() => {
    return flattenedBlocks.find(({ block }) => block.status === 'open')?.block;
  }, [flattenedBlocks]);

  const selectedBlock = useMemo(() => {
    return flattenedBlocks.find(({ block }) => block.id === selectedBlockId)?.block;
  }, [flattenedBlocks, selectedBlockId]);

  const onPlayNext = useCallback(async () => {
    if (!selectedBlock) return;
    trackManageAction('play_next', {
      from_block_id: selectedBlock.id,
      from_block_kind: selectedBlock.kind,
    });
    const nextBlock = await handlePlayNext(selectedBlock, flattenedBlocks);
    if (nextBlock) setSelectedBlockId(nextBlock.id);
  }, [selectedBlock, flattenedBlocks, handlePlayNext]);

  useEffect(() => {
    if (!selectedBlockId) {
      const firstActiveBlock = experience?.blocks?.find((block) => block.status === 'open');
      if (firstActiveBlock) {
        setSelectedBlockId(firstActiveBlock.id);
      }
    }
  }, [experience?.blocks, selectedBlockId]);

  if (isLoading || !wsReady) {
    return <section className="page flex-centered">Loading...</section>;
  }

  const errorMessage =
    !dismissedError &&
    (experienceError ||
      startError ||
      pauseError ||
      resumeError ||
      statusError ||
      detachError ||
      deleteError);
  const statusLabel = experience?.status
    ? experience.status.charAt(0).toUpperCase() + experience.status.slice(1)
    : '';

  return (
    <>
      <section className="flex w-full h-[calc(100dvh-var(--nav-h))] overflow-hidden relative">
        <BlockSidebar
          blocks={experience?.blocks || []}
          selectedBlockId={selectedBlockId}
          sidebarCollapsed={sidebarCollapsed}
          hasBlocks={Boolean(experience?.blocks?.length)}
          onSelectBlock={setSelectedBlockId}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          onCreateBlock={() => setIsCreateDialogOpen(true)}
          onReorderBlock={handleReorderBlock}
        />

        <main className="flex-1 flex flex-col w-full h-full z-10 overflow-hidden bg-[hsl(var(--background))]">
          <div className="flex items-center justify-between p-4 h-20 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold text-white">
                {experience?.name || 'Experience'}
              </div>
              {statusLabel && <Pill label={statusLabel} />}
            </div>
            <div className="flex items-center gap-2">
              <ExperienceActionButton />
              {selectedBlock && (
                <>
                  <span className="border-l border-[hsl(var(--border))] h-6 mx-1" />
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {BLOCK_KIND_LABELS[selectedBlock.kind]}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${getBlockStatusColor(selectedBlock.status)}`}
                  />
                  {selectedBlock.status === 'open' ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => handleStopPresenting(selectedBlock)}
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
                      onClick={() => handlePresent(selectedBlock)}
                      loading={busyBlockId === selectedBlock.id}
                      loadingText="Opening..."
                    >
                      <CircleDot size={16} />
                      <span>Open</span>
                    </Button>
                  )}
                </>
              )}
              <span className="border-l border-[hsl(var(--border))] h-6 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                aria-label="Participants"
                title="Participants"
                hideLabel
                icon={
                  showParticipantDetails ? <ChevronLeft size={16} /> : <ChevronRight size={16} />
                }
                onClick={() => setShowParticipantDetails((prev) => !prev)}
              >
                Participants
              </Button>
            </div>
          </div>

          {errorMessage && (
            <div className="mx-4 mt-4 px-4 py-3 bg-red-500/10 border border-red-500 text-red-400 rounded-md flex items-center justify-between">
              <span>{errorMessage}</span>
              <Button
                variant="ghost"
                size="sm"
                icon={<X size={16} />}
                hideLabel
                onClick={() => setDismissedError(true)}
              >
                Dismiss error
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {selectedBlock ? (
              <BlockDetailPanel
                selectedBlock={selectedBlock}
                currentOpenBlock={currentOpenBlock}
                viewMode={viewMode}
                monitorView={monitorView}
                participantView={participantView}
                impersonatedParticipantId={impersonatedParticipantId}
                participants={participantsCombined}
                onViewModeChange={setViewMode}
                onImpersonatedParticipantChange={setImpersonatedParticipantId}
                onEdit={setEditingBlock}
                onDetach={handleDetachBlock}
                detachingBlockId={detachingBlockId}
                onDelete={handleDeleteBlock}
                deletingBlockId={deletingBlockId}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[hsl(var(--muted-foreground))]">
                Select a block from the sidebar to view details
              </div>
            )}
          </div>
        </main>

        {showParticipantDetails && (
          <aside className="z-10 absolute h-full top-0 right-0 w-[420px] shrink-0 border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col">
            <div className="p-4 h-20 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Participants</div>
              <Button
                variant="ghost"
                size="sm"
                icon={<X size={16} />}
                hideLabel
                onClick={() => setShowParticipantDetails(false)}
              >
                Close participants panel
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ParticipantsTab
                participants={participantsCombined}
                segments={experience?.segments || []}
                defaultSegmentId={experience?.default_segment_id ?? null}
              />
            </div>
          </aside>
        )}
      </section>

      <Drawer open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DrawerContent style={{ maxWidth: '40rem' }}>
          <DrawerBody>
            <CreateBlock
              onClose={() => setIsCreateDialogOpen(false)}
              participants={participantsCombined}
              onEndCurrentBlock={async () => {
                if (!currentOpenBlock) return;
                await closeBlock(currentOpenBlock);
              }}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={editingBlock !== null}
        onOpenChange={(open) => {
          if (!open) setEditingBlock(null);
        }}
      >
        <DrawerContent style={{ maxWidth: '40rem' }}>
          <DrawerBody>
            {editingBlock && (
              <EditBlock
                block={editingBlock}
                onClose={() => setEditingBlock(null)}
                participants={participantsCombined}
              />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
