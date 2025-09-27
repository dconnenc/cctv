import { Block, BlockStatus, ParticipantSummary } from '@cctv/types';
import { fmtDate } from '@cctv/utils';

import { KVPill } from '../Manage';

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
