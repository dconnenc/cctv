import { useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';

import { useExperience } from '@cctv/contexts';
import { Button } from '@cctv/core';
import { useExperienceStart } from '@cctv/hooks/useExperienceStart';
import { Block, BlockStatus, Experience, ParticipantSummary } from '@cctv/types';

import CreateExperience from './CreateExperience/CreateExperience';
import styles from './Manage.module.scss';
import ViewUserScreen from './ViewUserScreen/ViewUserScreen';

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

function KVPill({ label }: { label: string }) {
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

function BlockRowMenu({
  block,
  onChange,
  busy,
}: {
  block: Block;
  onChange: (next: BlockStatus) => void;
  busy?: boolean;
}) {
  const choose = (status: BlockStatus) => () => onChange(status);
  return (
    <details className={styles.menu}>
      <summary className={styles.menuButton} aria-label="Open row actions" />
      <div className={styles.menuList} role="menu">
        <button
          className={styles.menuItem}
          onClick={choose('open')}
          disabled={busy || block.status === 'open'}
        >
          Set “open”
        </button>
        <button
          className={styles.menuItem}
          onClick={choose('closed')}
          disabled={busy || block.status === 'closed'}
        >
          Set “closed”
        </button>
        <button
          className={styles.menuItem}
          onClick={choose('hidden')}
          disabled={busy || block.status === 'hidden'}
        >
          Set “hidden”
        </button>
      </div>
    </details>
  );
}

function BlocksTable({
  blocks,
  onChange,
  busyId,
  participants,
}: {
  blocks: Block[];
  onChange: (b: Block, s: BlockStatus) => void;
  busyId?: string | null;
  participants?: ParticipantSummary[];
}) {
  if (!blocks?.length) return <div className={styles.emptyState}>No blocks yet.</div>;

  const totalParticipants = participants?.length || 0;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Block ID</th>
            <th>Kind</th>
            <th>Status</th>
            <th>Responses</th>
            <th>Visible roles</th>
            <th>Segments</th>
            <th>Targets</th>
            <th>Created</th>
            <th aria-label="Row actions" />
          </tr>
        </thead>
        <tbody>
          {blocks.map((b) => (
            <tr key={b.id}>
              <td className={styles.mono}>{b.id}</td>
              <td>{b.kind}</td>
              <td>
                <KVPill label={b.status} />
                {busyId === b.id && <span className={styles.subtle}> • updating…</span>}
              </td>
              <td>
                {b.responses ? (
                  <div>
                    <div>
                      {b.responses.total} / {totalParticipants}
                    </div>
                    {b.kind === 'poll' &&
                      b.responses.aggregate &&
                      Object.keys(b.responses.aggregate).length > 0 && (
                        <details className={styles.pollDetails}>
                          <summary>View breakdown</summary>
                          <ul className={styles.pollBreakdown}>
                            {Object.entries(b.responses?.aggregate || {}).map(([option, count]) => (
                              <li key={option}>
                                {option}: {count} (
                                {Math.round((count / (b.responses?.total || 1)) * 100)}%)
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    {(b.kind === 'question' || b.kind === 'multistep_form') && (
                      <div className={styles.responseCount}>
                        {b.responses.total} response{b.responses.total !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  '—'
                )}
              </td>
              <td>
                {b.visible_to_roles?.length
                  ? b.visible_to_roles.map((r) => <KVPill key={r} label={r} />)
                  : '—'}
              </td>
              <td>
                {b.visible_to_segments?.length
                  ? b.visible_to_segments.map((s) => <KVPill key={s} label={s} />)
                  : '—'}
              </td>
              <td>{b.target_user_ids?.length ?? 0}</td>
              <td>{fmtDate(b.created_at)}</td>
              <td className={styles.rowMenuCell}>
                <BlockRowMenu block={b} onChange={(s) => onChange(b, s)} busy={busyId === b.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useChangeBlockStatus() {
  const { code, experienceFetch } = useExperience();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = useCallback(
    async (
      block: Block,
      status: BlockStatus,
    ): Promise<{ success: boolean; error?: string } | null> => {
      if (!code) {
        setError('Missing experience code');
        return null;
      }
      setIsLoading(true);
      setError(null);

      const baseUrl = `/api/experiences/${encodeURIComponent(code)}/blocks/${encodeURIComponent(block.id)}/`;

      try {
        let path = '';
        const method = 'POST';
        let body: any = undefined;

        if (status === 'open') {
          path = `${baseUrl}open`;
        } else if (status === 'closed') {
          path = `${baseUrl}close`;
        }

        body = JSON.stringify({ experience: { status: 'hidden' } });

        const res = await experienceFetch(path, { method, body });
        const data = await res.json();
        if (!res.ok || data?.success === false) {
          const msg = data?.error || `Failed to set status to ${status}`;
          setError(msg);

          return { success: false, error: msg };
        }
        return { success: true };
      } catch (e: any) {
        const msg =
          e?.message === 'Authentication expired'
            ? 'Authentication expired'
            : 'Connection error. Please try again.';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [code, experienceFetch],
  );

  return { change, isLoading, error, setError };
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
          <div className={styles.detailsContent}>
            <div>Kind: {currentBlock?.kind}</div>
            <div>Responses: {currentBlock?.responses?.total}</div>
            <div>Status: {currentBlock?.status}</div>
            {currentBlock?.visible_to_roles?.length && (
              <div>Visible to roles: {currentBlock?.visible_to_roles?.join(', ')}</div>
            )}
            {currentBlock?.visible_to_segments?.length && (
              <div>Visible to segments: {currentBlock?.visible_to_segments?.join(', ')}</div>
            )}
            {currentBlock?.target_user_ids?.length && (
              <div>Target user IDs: {currentBlock?.target_user_ids?.join(', ')}</div>
            )}
          </div>
        </div>
        <div className={styles.viewTvScreen}>
          <SectionHeader title="TV screen" />
          <div className={styles.screen}>TV here</div>
        </div>
      </div>
      <div className={styles.bottom}>
        <div className={styles.details}>
          <SectionHeader title="Details" />
          <div className={styles.detailsContent}>
            <div>Code: {code}</div>
            <div>Status: {experienceStatus}</div>
            <div>Created: {fmtDate(experience?.created_at)}</div>
            <div>Updated: {fmtDate(experience?.updated_at)}</div>
          </div>
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
              Create experience
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
  //     <div className={styles.headerRow}>
  //       {experience?.status === 'live' && (
  //         <NavLink to={`/experiences/${code}`} className="link">
  //           Back to lobby
  //         </NavLink>
  //       )}
  //       <h1 className={styles.title}>Code: {code}</h1>
  //       {(experience?.status === 'lobby' || experience?.status === 'draft') && (
  //         <Button onClick={startExperience} loading={starting} loadingText="Starting...">
  //           Start!
  //         </Button>
  //       )}
  //       <div className={styles.meta}>
  //         <div className={styles.metaItem}>
  //           Status: <KVPill label={experienceStatus || '—'} />
  //           {isPolling ? <span className={styles.subtle}> • polling</span> : null}
  //           {changingStatus && <span className={styles.subtle}> • updating block…</span>}
  //         </div>
  //         {participant?.email && <span> • You: {participant.email}</span>}
  //       </div>
  //     </div>

  //     {(topError || statusError || startError) && (
  //       <div className={styles.errorBanner} role="alert">
  //         {topError || statusError || startError}
  //       </div>
  //     )}

  //     {/* Participants */}
  //     <div className={styles.card}>
  //       <SectionHeader title="Experience Participants" />
  //       <ParticipantsTable rows={participantsCombined} />
  //     </div>

  //     {/* Blocks */}
  //     <div className={styles.card}>
  //       <SectionHeader title="Experience Blocks">
  //         <Button onClick={() => setShowCreate(!showCreate)} aria-expanded={showCreate}>
  //           {showCreate ? 'Close form' : 'Add new'}
  //         </Button>
  //       </SectionHeader>

  //       <BlocksTable
  //         blocks={blocks}
  //         onChange={onChangeBlockStatus}
  //         busyId={busyBlockId}
  //         participants={participantsCombined}
  //       />
  //     </div>
  //   </section>
  // );
}
