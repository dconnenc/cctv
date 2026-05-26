import { ArrowDown, ArrowUp, X } from 'lucide-react';

import { BLOCK_KIND_LABELS, Block } from '@cctv/types';

import { Button } from '../Button/Button';
import { Panel } from '../Panel/Panel';

import styles from './SourcesPanel.module.scss';

export interface SourcesPanelProps {
  sources: Block[];
  candidates: Block[];
  onAttach: (sourceBlockId: string) => unknown;
  onDetach: (sourceBlockId: string) => unknown;
  onReorder: (orderedIds: string[]) => unknown;
  busy?: boolean;
  emptyMessage?: string;
}

export function SourcesPanel({
  sources,
  candidates,
  onAttach,
  onDetach,
  onReorder,
  busy = false,
  emptyMessage = 'No sources attached yet.',
}: SourcesPanelProps) {
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= sources.length) return;
    const next = sources.map((s) => s.id);
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onReorder(next);
  };

  return (
    <Panel
      title="Sources"
      headerContent={<span className={styles.count}>{sources.length} attached</span>}
    >
      {sources.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <ol className={styles.list}>
          {sources.map((source, index) => {
            const label =
              (source.payload as { question?: string; title?: string; message?: string })
                .question ??
              (source.payload as { title?: string }).title ??
              (source.payload as { message?: string }).message ??
              '(untitled)';

            return (
              <li key={source.id} className={styles.item} aria-label={`source ${index + 1}`}>
                <div className={styles.itemMeta}>
                  <span className={styles.kind}>{BLOCK_KIND_LABELS[source.kind]}</span>
                  <span className={styles.label}>{label}</span>
                  <span className={styles.status}>{source.status}</span>
                </div>
                <div className={styles.itemActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ArrowUp size={14} />}
                    hideLabel
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    Move up
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ArrowDown size={14} />}
                    hideLabel
                    disabled={busy || index === sources.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    Move down
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X size={14} />}
                    hideLabel
                    disabled={busy}
                    onClick={() => onDetach(source.id)}
                  >
                    Detach
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <AttachControl candidates={candidates} onAttach={onAttach} disabled={busy} />
    </Panel>
  );
}

interface AttachControlProps {
  candidates: Block[];
  onAttach: (id: string) => unknown;
  disabled?: boolean;
}

function AttachControl({ candidates, onAttach, disabled }: AttachControlProps) {
  if (candidates.length === 0) {
    return <p className={styles.empty}>No compatible blocks available to attach.</p>;
  }

  return (
    <div className={styles.attach}>
      <label htmlFor="attach-source" className={styles.attachLabel}>
        Attach source
      </label>
      <select
        id="attach-source"
        className={styles.select}
        value=""
        disabled={disabled}
        onChange={(e) => {
          if (e.target.value) {
            onAttach(e.target.value);
            e.target.value = '';
          }
        }}
      >
        <option value="">Select a block…</option>
        {candidates.map((c) => {
          const label =
            (c.payload as { question?: string; title?: string; message?: string }).question ??
            (c.payload as { title?: string }).title ??
            (c.payload as { message?: string }).message ??
            '(untitled)';
          return (
            <option key={c.id} value={c.id}>
              {BLOCK_KIND_LABELS[c.kind]} — {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}
