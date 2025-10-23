import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useExperience } from '@cctv/contexts';
import { Panel } from '@cctv/core';
import {
  useChangeBlockStatus,
  useExperiencePause,
  useExperienceResume,
  useExperienceStart,
} from '@cctv/hooks';
import { Block, BlockStatus, ParticipantSummary } from '@cctv/types';

import ContextDetails from './ContextDetails/ContextDetails';
import ContextView from './ContextView/ContextView';
import ExperienceControl from './ExperienceControl/ExperienceControl';
import ParticipantsTab from './ParticipantsTab/ParticipantsTab';
import ProgramTab from './ProgramTab/ProgramTab';
import UpNextPanel from './UpNextPanel/UpNextPanel';

import styles from './Manage.module.scss';

type Tab = 'program' | 'participants';

export default function Manage() {
  const navigate = useNavigate();
  const {
    experience,
    code,
    isLoading,
    error: experienceError,
    tvView,
    participantView,
    impersonatedParticipantId,
    setImpersonatedParticipantId,
  } = useExperience();

  const { startExperience, isLoading: starting, error: startError } = useExperienceStart();
  const { pauseExperience, isLoading: pausing, error: pauseError } = useExperiencePause();
  const { resumeExperience, isLoading: resuming, error: resumeError } = useExperienceResume();

  const [activeTab, setActiveTab] = useState<Tab>('program');
  const [busyBlockId, setBusyBlockId] = useState<string>();
  const [viewMode, setViewMode] = useState<'tv' | 'participant'>('tv');

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
    navigate(`/experiences/${code}/manage/blocks/new`);
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
    viewMode === 'tv'
      ? tvView?.blocks.find((block) => block.status === 'open')
      : participantView?.blocks[0];

  const participant = participantsCombined.find((p) => p.id === impersonatedParticipantId);

  return (
    <section className={styles.root}>
      {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

      <div className={styles.topRow}>
        <div className={styles.upNext}>
          <UpNextPanel />
        </div>

        <div className={styles.contextDetails}>
          <ContextDetails
            tvView={tvView}
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
            emptyMessage={viewMode === 'tv' ? 'No block on TV' : 'No block for participant'}
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
              />
            ) : (
              <ParticipantsTab participants={participantsCombined} />
            )}
          </div>
        </Panel>
      </div>
    </section>
  );
}
