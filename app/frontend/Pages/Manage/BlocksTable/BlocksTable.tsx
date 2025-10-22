import { useMemo, useState } from 'react';

import { Button, Column, Pill, Table } from '@cctv/core';
import { Block, BlockKind, BlockStatus, ParticipantSummary } from '@cctv/types';
import { fmtDate } from '@cctv/utils';

import { BlockTree } from '../BlockTree/BlockTree';

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
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
  const totalParticipants = participants?.length || 0;

  const hasHierarchy = blocks.some((b) => b.child_block_ids && b.child_block_ids.length > 0);

  const columns: Column<Block>[] = useMemo(() => {
    return [
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

  return (
    <div>
      {hasHierarchy && (
        <div className={styles.viewModeToggle}>
          <Button onClick={() => setViewMode('table')} disabled={viewMode === 'table'}>
            Table View
          </Button>
          <Button onClick={() => setViewMode('tree')} disabled={viewMode === 'tree'}>
            Tree View
          </Button>
        </div>
      )}
      {viewMode === 'tree' && hasHierarchy ? (
        <BlockTree blocks={blocks} participants={participants || []} />
      ) : (
        <Table columns={columns} data={blocks} emptyState="No blocks yet." />
      )}
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
