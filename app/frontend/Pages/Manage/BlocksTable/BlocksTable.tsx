import { useMemo } from 'react';

import { Column, Pill, Table } from '@cctv/core';
import { Block, BlockStatus, ParticipantSummary } from '@cctv/types';
import { fmtDate } from '@cctv/utils';

import styles from './BlocksTable.module.scss';

export function BlocksTable({
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
  const totalParticipants = participants?.length || 0;

  const columns: Column<Block>[] = useMemo(() => {
    return [
      { key: 'id', label: 'Block ID', Cell: (b) => <span className={styles.mono}>{b.id}</span> },
      { key: 'kind', label: 'Kind', Cell: (b) => <span>{b.kind}</span> },
      { key: 'status', label: 'Status', Cell: (b) => <Pill label={b.status} /> },
      {
        key: 'responses',
        label: 'Responses',
        Cell: (b) => (
          <span>
            {b.responses?.total} / {totalParticipants}
          </span>
        ),
      },
      {
        key: 'visible_to_roles',
        label: 'Visible roles',
        Cell: (b) => (
          <span>
            {b.visible_to_roles?.length
              ? b.visible_to_roles.map((r) => <Pill key={r} label={r} />)
              : '—'}
          </span>
        ),
      },
      {
        key: 'visible_to_segments',
        label: 'Segments',
        Cell: (b) => (
          <span>
            {b.visible_to_segments?.length
              ? b.visible_to_segments.map((s) => <Pill key={s} label={s} />)
              : '—'}
          </span>
        ),
      },
      {
        key: 'target_user_ids',
        label: 'Targets',
        Cell: (b) => <span>{b.target_user_ids?.length ?? 0}</span>,
      },
      { key: 'created_at', label: 'Created', Cell: (b) => <span>{fmtDate(b.created_at)}</span> },
      {
        key: 'actions',
        label: 'Actions',
        isHidden: true,
        Cell: (b) => (
          <BlockRowMenu block={b} onChange={(s) => onChange(b, s)} busy={busyId === b.id} />
        ),
      },
    ];
  }, []);

  return <Table columns={columns} data={blocks} emptyState="No blocks yet." />;
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
