import { useCallback, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useExperience } from '@cctv/contexts';
import { Panel } from '@cctv/core';
import { useChangeBlockStatus, useExperiencePreview, useExperienceStart } from '@cctv/hooks';
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
    jwt,
    isLoading,
    error: experienceError,
    experienceFetch,
    refetchExperience,
  } = useExperience();

  const { startExperience, isLoading: starting, error: startError } = useExperienceStart();
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | undefined>(
    experience?.participants[0]?.id,
  );
  const [activeTab, setActiveTab] = useState<Tab>('program');
  const [busyBlockId, setBusyBlockId] = useState<string>();
  const [viewMode, setViewMode] = useState<'tv' | 'participant'>('tv');

  const {
    tvView,
    participantView,
    isConnected: previewConnected,
  } = useExperiencePreview({
    code: code || '',
    participantId: selectedParticipantId,
    enabled: !!selectedParticipantId,
    jwt,
  });

  const participantsCombined: ParticipantSummary[] = useMemo(
    () => [...(experience?.hosts || []), ...(experience?.participants || [])],
    [experience],
  );

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

      if (code) {
        try {
          const res = await experienceFetch(`/api/experiences/${encodeURIComponent(code)}`, {
            method: 'GET',
          });

          const data: { success?: boolean } = await res.json();

          if (data?.success) {
            await refetchExperience();
          }
        } catch {}
      }

      if (!result?.success && result?.error) {
        alert(result.error);
      }

      setBusyBlockId(undefined);
    },
    [code, experienceFetch, changeStatus, setStatusError, refetchExperience],
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

  const errorMessage = experienceError || startError || statusError;

  const currentBlock =
    viewMode === 'tv'
      ? tvView?.blocks.find((block) => block.status === 'open')
      : participantView?.blocks[0];

  const participant = participantsCombined.find((p) => p.id === selectedParticipantId);

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
            selectedParticipantId={selectedParticipantId}
            setSelectedParticipantId={setSelectedParticipantId}
            isConnected={previewConnected}
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
            onPause={startExperience}
            isStarting={starting}
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
