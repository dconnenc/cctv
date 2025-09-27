import { useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';

import { useExperience } from '@cctv/contexts';
import { Button } from '@cctv/core';
import { useChangeBlockStatus, useExperienceStart } from '@cctv/hooks';
import { Block, BlockStatus, Experience, ParticipantSummary } from '@cctv/types';

import { BlocksTable } from './BlocksTable/BlocksTable';
import CreateExperience from './CreateExperience/CreateExperience';
import ViewBlockDetails from './ViewBlockDetails/ViewBlockDetails';
import ViewExperienceDetails from './ViewExperienceDetails/ViewExperienceDetails';
import ViewUserScreen from './ViewUserScreen/ViewUserScreen';

import styles from './Manage.module.scss';

export function KVPill({ label }: { label: string }) {
  return <span className={styles.pill}>{label}</span>;
}

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className={styles.headerRow}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <div className={styles.headerActions}>{children}</div>
    </div>
  );
}

function ParticipantsTable({ rows }: { rows: ParticipantSummary[] }) {
  if (!rows?.length) return <div className={styles.emptyState}>No participants yet.</div>;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={`${p.role}:${p.id}`}>
              <td className={styles.mono}>{p.id}</td>
              <td>{p.name || '—'}</td>
              <td>{p.email || '—'}</td>
              <td>
                <KVPill label={p.role} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Manage() {
  const {
    experience,
    participant,
    code,
    isLoading,
    isPolling,
    experienceStatus,
    error: experienceError,
    experienceFetch,
  } = useExperience();

  const { startExperience, isLoading: starting, error: startError } = useExperienceStart();

  const [model, setModel] = useState(experience);

  useEffect(() => {
    setModel(experience);
  }, [experience]);

  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [showBlocks, setShowBlocks] = useState<boolean>(false);
  const [busyBlockId, setBusyBlockId] = useState<string | null>(null);

  const topError = useMemo(() => experienceError, [experienceError]);

  const participantsCombined: ParticipantSummary[] = [
    ...(model?.hosts || []),
    ...(model?.participants || []),
  ];

  const blocks: Block[] = Array.isArray((model as any)?.blocks)
    ? ((model as any)?.blocks as Block[])
    : [];

  const {
    change: changeStatus,
    isLoading: changingStatus,
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
          const data = (await res.json()) as {
            success?: boolean;
            experience?: Experience;
          };
          if ((res.ok && data?.experience) || data?.success)
            setModel((data as any).experience || (data as any));
        } catch {}
      }

      if (!result?.success && result?.error) {
        alert(result.error);
      }

      setBusyBlockId(null);
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
          blocks={blocks}
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
          code={code}
          experienceFetch={experienceFetch}
          setModel={setModel}
          onClose={() => setShowCreate(false)}
          onEndCurrentBlock={() => onChangeBlockStatus(currentBlock, 'closed')}
          participants={participantsCombined}
        />
      </section>
    );
  }

  return (
    <section className={styles.root}>
      <div className={styles.top}>
        <div className={styles.viewUserScreen}>
          <SectionHeader title="Audience's view" />
          <ViewUserScreen className={styles.screen} experience={experience} />
        </div>
        <div className={styles.viewExperienceDetails}>
          <SectionHeader title="Experience Details" />
          <ViewBlockDetails currentBlock={currentBlock} />
        </div>
        <div className={styles.viewTvScreen}>
          <SectionHeader title="TV screen" />
          <div className={styles.screen}>TV here</div>
        </div>
      </div>
      <div className={styles.bottom}>
        <div className={styles.details}>
          <SectionHeader title="Details" />
          <ViewExperienceDetails experience={experience} />
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
