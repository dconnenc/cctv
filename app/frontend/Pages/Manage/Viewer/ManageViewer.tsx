import { useCallback, useEffect, useMemo, useState } from 'react';

import { Link, useLocation } from 'react-router-dom';

import { Bug, Pause, Play, X } from 'lucide-react';

import { Dialog, DialogContent } from '@cctv/components/ui/dialog';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Button } from '@cctv/core/Button/Button';
import { Pill } from '@cctv/core/Pill/Pill';
import { useBlockPresentation } from '@cctv/hooks/useBlockPresentation';
import { useExperiencePause } from '@cctv/hooks/useExperiencePause';
import { useExperienceResume } from '@cctv/hooks/useExperienceResume';
import { useExperienceStart } from '@cctv/hooks/useExperienceStart';
import { Block, ParticipantSummary } from '@cctv/types';

import CreateBlock from '../CreateBlock/CreateBlock';
import ParticipantsTab from '../ParticipantsTab/ParticipantsTab';
import BlockDetailPanel from './BlockDetailPanel';
import BlockSidebar from './BlockSidebar';
import DebugPanel from './DebugPanel/DebugPanel';

function ExperienceActionButton() {
  const { experience } = useExperience();
  const { startExperience, isLoading: starting } = useExperienceStart();
  const { pauseExperience, isLoading: pausing } = useExperiencePause();
  const { resumeExperience, isLoading: resuming } = useExperienceResume();

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
}

export default function ManageViewer() {
  const location = useLocation();
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showParticipantDetails, setShowParticipantDetails] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    experience,
    error: experienceError,
    isLoading,
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

  const onPlayNext = useCallback(async () => {
    if (!selectedBlock) return;
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
        <BlockSidebar
          flattenedBlocks={flattenedBlocks}
          selectedBlockId={selectedBlockId}
          sidebarCollapsed={sidebarCollapsed}
          hasBlocks={Boolean(experience?.blocks?.length)}
          onSelectBlock={setSelectedBlockId}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          onCreateBlock={() => setIsCreateDialogOpen(true)}
        />

        <main className="flex-1 flex flex-col w-full h-full z-10 overflow-hidden bg-[hsl(var(--background))]">
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
              <ExperienceActionButton />
              <button
                onClick={() => setShowDebugPanel((prev) => !prev)}
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
                onClick={() => setShowParticipantDetails((prev) => !prev)}
                className="px-3 py-1.5 text-sm rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors"
              >
                {showParticipantDetails ? 'Hide Participants' : 'Participants'}
              </button>
            </div>
          </div>

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

          <div className="flex-1 overflow-y-auto p-4">
            {selectedBlock ? (
              <BlockDetailPanel
                selectedBlock={selectedBlock}
                currentOpenBlock={currentOpenBlock}
                busyBlockId={busyBlockId}
                viewMode={viewMode}
                monitorView={monitorView}
                participantView={participantView}
                impersonatedParticipantId={impersonatedParticipantId}
                participants={participantsCombined}
                onPresent={handlePresent}
                onStopPresenting={handleStopPresenting}
                onPlayNext={onPlayNext}
                onViewModeChange={setViewMode}
                onImpersonatedParticipantChange={setImpersonatedParticipantId}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[hsl(var(--muted-foreground))]">
                Select a block from the sidebar to view details
              </div>
            )}
          </div>
        </main>

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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-3xl w-full">
          <CreateBlock
            onClose={() => setIsCreateDialogOpen(false)}
            participants={participantsCombined}
            onEndCurrentBlock={async () => {
              if (!currentOpenBlock) return;
              await closeBlock(currentOpenBlock);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showDebugPanel} onOpenChange={setShowDebugPanel}>
        <DialogContent className="sm:max-w-2xl w-full">
          <DebugPanel selectedBlock={selectedBlock} />
        </DialogContent>
      </Dialog>
    </>
  );
}
