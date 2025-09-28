import { useCallback, useMemo, useState } from 'react';

import classNames from 'classnames';

import { useExperience } from '@cctv/contexts';
import { Button, Column, Pill, Table } from '@cctv/core';
import { useChangeBlockStatus, useExperienceStart } from '@cctv/hooks';
import { Block, BlockStatus, Experience, ParticipantSummary } from '@cctv/types';

import { BlocksTable } from './BlocksTable/BlocksTable';
import CreateExperience from './CreateExperience/CreateExperience';
import SectionHeader from './SectionHeader/SectionHeader';
import ViewAudienceSection from './ViewAudienceSection/ViewAudienceSection';
import ViewExperienceDetails from './ViewExperienceDetails/ViewExperienceDetails';
import ViewTvSection from './ViewTvSection/ViewTvSection';

import styles from './Manage.module.scss';

export default function Manage() {
  const {
    experience,
    code,
    isLoading,
    isPolling,
    experienceStatus,
    error: experienceError,
    experienceFetch,
    refetchExperience,
  } = useExperience();

  const { startExperience, isLoading: starting, error: startError } = useExperienceStart();
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | undefined>(
    experience?.participants[0].id,
  );
  const [view, setView] = useState<'audience' | 'tv'>('audience');

  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [showBlocks, setShowBlocks] = useState<boolean>(false);
  const [busyBlockId, setBusyBlockId] = useState<string>();

  const participantsCombined: ParticipantSummary[] = [
    ...(experience?.hosts || []),
    ...(experience?.participants || []),
  ];

  const {
    change: changeStatus,
    error: statusError,
    setError: setStatusError,
  } = useChangeBlockStatus();

  const onChangeBlockStatus = useCallback(
    async (block: Block | undefined, next: BlockStatus) => {
      console.log('onChangeBlockStatus', block, next, code);
      if (!block) return;
      if (!code) return;
      setBusyBlockId(block.id);
      setStatusError(null);

      const result = await changeStatus(block, next);

      // No optimistic updates: re-fetch experience when done
      if (code) {
        try {
          const res = await experienceFetch(`/api/experiences/${encodeURIComponent(code)}`, {
            method: 'GET',
          });

          const data: {
            success?: boolean;
            experience?: Experience;
          } = await res.json();

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
    [code, experienceFetch, changeStatus, setStatusError],
  );

  const currentBlock = useMemo(
    () => experience?.blocks.find((block) => block.status === 'open'),
    [experience],
  );

  if (isLoading) {
    return (
      <section className="page flex-centered">
        <h1 className={styles.title}>{code || 'Experience'}</h1>
        <p className={styles.subtitle}>Preparing experience…</p>
      </section>
    );
  }

  if (showBlocks) {
    return (
      <section className={classNames('page', styles.root)}>
        <BlocksTable
          blocks={experience?.blocks || []}
          onChange={onChangeBlockStatus}
          busyId={busyBlockId}
          participants={participantsCombined}
        />
        <div>
          <Button onClick={() => setShowBlocks(false)}>Back</Button>
        </div>
      </section>
    );
  }

  if (showCreate) {
    return (
      <section className={classNames('page', styles.root)}>
        <CreateExperience
          refetchExperience={refetchExperience}
          onClose={() => setShowCreate(false)}
          onEndCurrentBlock={() => onChangeBlockStatus(currentBlock, 'closed')}
          participants={participantsCombined}
        />
      </section>
    );
  }

  const ViewSection = view === 'audience' ? ViewAudienceSection : ViewTvSection;

  const errorMessage = experienceError || startError || statusError;

  return (
    <section className={styles.root}>
      {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

      <ViewSection
        className={styles.top}
        experience={experience}
        participantId={selectedParticipantId}
        setSelectedParticipantId={setSelectedParticipantId}
      />

      <Button onClick={() => setView(view === 'audience' ? 'tv' : 'audience')}>
        Switch to {view === 'audience' ? 'TV' : 'Audience'}
      </Button>

      <div className={styles.bottom}>
        <div className={styles.details}>
          <SectionHeader title="Details" />
          <ViewExperienceDetails isPolling={isPolling} experience={experience} />
        </div>
        <div className={styles.participants}>
          <SectionHeader title="Participants" />
          <ParticipantsTable rows={participantsCombined} />
        </div>
        <div className={styles.actions}>
          <SectionHeader title="Actions" />
          <div className={styles.actionsContent}>
            <Button onClick={startExperience} loading={starting} loadingText="Starting...">
              {experienceStatus === 'live' ? 'Pause' : 'Start'}
            </Button>
          </div>
          <div className={styles.actionsContent}>
            <Button onClick={() => setShowCreate(true)} loading={starting}>
              Create block
            </Button>
          </div>
          <div className={styles.actionsContent}>
            <Button onClick={() => setShowBlocks(true)} loading={starting}>
              View all blocks
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ParticipantsTable({ rows }: { rows: ParticipantSummary[] }) {
  const columns: Column<ParticipantSummary>[] = useMemo(() => {
    return [
      { key: 'id', label: 'ID', Cell: (p) => <span className={styles.mono}>{p.id}</span> },
      { key: 'name', label: 'Name', Cell: (p) => <span>{p.name || '—'}</span> },
      { key: 'email', label: 'Email', Cell: (p) => <span>{p.email || '—'}</span> },
      { key: 'role', label: 'Role', Cell: (p) => <Pill label={p.role} /> },
    ];
  }, []);

  return <Table columns={columns} data={rows} emptyState="No participants yet." />;
}
