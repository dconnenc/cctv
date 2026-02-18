import { useCallback, useEffect, useMemo, useState } from 'react';

import { Link } from 'react-router-dom';

import { Dialog, DialogContent } from '@cctv/components/ui/dialog';
import { useExperience } from '@cctv/contexts/ExperienceContext';
import { Panel } from '@cctv/core/Panel/Panel';
import { useChangeBlockStatus } from '@cctv/hooks/useChangeBlockStatus';
import { useExperiencePause } from '@cctv/hooks/useExperiencePause';
import { useExperienceResume } from '@cctv/hooks/useExperienceResume';
import { useExperienceStart } from '@cctv/hooks/useExperienceStart';
import { Block, BlockStatus, ParticipantSummary } from '@cctv/types';

import BlockViewer from '../Block/Block';
import ContextDetails from './ContextDetails/ContextDetails';
import ContextView from './ContextView/ContextView';
import CreateBlock from './CreateBlock/CreateBlock';
import ExperienceControl from './ExperienceControl/ExperienceControl';
import ParticipantsTab from './ParticipantsTab/ParticipantsTab';
import ProgramTab from './ProgramTab/ProgramTab';

import styles from './Manage.module.scss';

type Tab = 'program' | 'participants';

export default function Manage() {
  const {
    experience,
    code,
    isLoading,
    error: experienceError,
    monitorView,
    participantView,
    impersonatedParticipantId,
    setImpersonatedParticipantId,
  } = useExperience();

  const { startExperience, isLoading: starting, error: startError } = useExperienceStart();
  const { pauseExperience, isLoading: pausing, error: pauseError } = useExperiencePause();
  const { resumeExperience, isLoading: resuming, error: resumeError } = useExperienceResume();

  const [activeTab, setActiveTab] = useState<Tab>('program');
  const [busyBlockId, setBusyBlockId] = useState<string>();
  const [viewMode, setViewMode] = useState<'monitor' | 'participant'>('monitor');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showBlockId, setShowBlockId] = useState<string | null>(null);

  const participantsCombined: ParticipantSummary[] = useMemo(
    () => [...(experience?.hosts || []), ...(experience?.participants || [])],
    [experience],
  );

  // Initialize impersonated participant to first participant when experience loads
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

  const onChangeBlockStatus = useCallback(
    async (block: Block | undefined, next: BlockStatus) => {
      if (!block || !code) return;

      setBusyBlockId(block.id);
      setStatusError(null);

      const result = await changeStatus(block, next);

      if (!result?.success && result?.error) {
        alert(result.error);
      }

      setBusyBlockId(undefined);
    },
    [code, changeStatus, setStatusError],
  );

  const handleCreateBlock = () => {
    setIsCreateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code || 'Experience'}</h1>
        <p className={styles.subtitle}>Preparing experience…</p>
      </section>
    );
  }

  const errorMessage = experienceError || startError || pauseError || resumeError || statusError;
  const isChangingState = starting || pausing || resuming;

  const currentBlock =
    viewMode === 'monitor'
      ? monitorView?.blocks.find((block) => block.status === 'open')
      : participantView?.blocks[0];

  const participant = participantsCombined.find((p) => p.id === impersonatedParticipantId);

  return (
    <>
      <section className={styles.root}>
        {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}
        <Link className="text-lg text-yellow-500 z-10" to={location.pathname.replace('/old', '')}>
          Go to new view
        </Link>

        <div className={styles.topRow}>
          <div className={styles.upNext}>
            <ContextView
              block={
                viewMode === 'monitor'
                  ? (monitorView?.next_block ?? undefined)
                  : (participantView?.next_block ?? undefined)
              }
              participant={viewMode === 'participant' ? participant : undefined}
              emptyMessage={
                viewMode === 'monitor'
                  ? 'No upcoming block for Monitor'
                  : `No upcoming block for ${participant?.name || 'participant'}`
              }
              monitorView={undefined}
              viewMode={viewMode}
              title="Up Next"
            />
          </div>

          <div className={styles.contextDetails}>
            <ContextDetails
              monitorView={monitorView}
              participantView={participantView}
              participants={participantsCombined}
              selectedParticipantId={impersonatedParticipantId}
              setSelectedParticipantId={setImpersonatedParticipantId}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          </div>

          <div className={styles.contextView}>
            <ContextView
              block={currentBlock}
              participant={viewMode === 'participant' ? participant : undefined}
              emptyMessage={
                viewMode === 'monitor' ? 'No block on Monitor' : 'No block for participant'
              }
              monitorView={monitorView}
              viewMode={viewMode}
              title="Current"
            />
          </div>
        </div>

        <div className={styles.bottomRow}>
          <div className={styles.experienceInfo}>
            <ExperienceControl
              experience={experience}
              onStart={startExperience}
              onPause={pauseExperience}
              onResume={resumeExperience}
              isLoading={isChangingState}
              onCreateBlock={handleCreateBlock}
            />
          </div>

          <Panel className={styles.tableContainer}>
            <div className={styles.tabs}>
              <button
                className={activeTab === 'program' ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab('program')}
              >
                Program
              </button>
              <button
                className={activeTab === 'participants' ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab('participants')}
              >
                Participants
              </button>
            </div>

            <div className={styles.tabContent}>
              {activeTab === 'program' ? (
                <ProgramTab
                  blocks={experience?.blocks || []}
                  participants={participantsCombined}
                  onBlockStatusChange={onChangeBlockStatus}
                  busyBlockId={busyBlockId}
                  onBlockClick={setShowBlockId}
                />
              ) : (
                <ParticipantsTab participants={participantsCombined} />
              )}
            </div>
          </Panel>
        </div>
      </section>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-3xl w-full">
          <CreateBlock
            onClose={() => setIsCreateDialogOpen(false)}
            participants={participantsCombined}
            onEndCurrentBlock={async () => {
              if (!currentBlock) return;
              await changeStatus(currentBlock, 'closed');
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={!!showBlockId} onOpenChange={(open) => !open && setShowBlockId(null)}>
        <DialogContent className="sm:max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {showBlockId && <BlockViewer blockId={showBlockId} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
