import classNames from 'classnames';

import { BLOCK_KIND_LABELS, Block, BlockKind } from '@cctv/types';

import KindPreview from './KindPreview';

import styles from './ActivityTile.module.scss';

interface ActivityTileProps {
  kind: BlockKind;
  label: string;
  summary?: string;
  isDraft?: boolean;
  onClick: () => void;
}

export function ActivityTile({ kind, label, summary, isDraft, onClick }: ActivityTileProps) {
  return (
    <button
      type="button"
      className={classNames(styles.root, isDraft && styles.draft)}
      onClick={onClick}
    >
      {isDraft && <span className={styles.badge}>Draft</span>}
      <KindPreview kind={kind} />
      <div className={styles.footer}>
        <span className={styles.label}>{label}</span>
        {isDraft && <span className={styles.kind}>{BLOCK_KIND_LABELS[kind]}</span>}
      </div>
      {summary && <span className={styles.summary}>{summary}</span>}
    </button>
  );
}

export function blockSummary(block: Block): string {
  const payload = block.payload as Record<string, unknown>;
  const candidates = ['question', 'title', 'prompt', 'message', 'headline'];

  for (const key of candidates) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  const questions = payload.questions;
  if (Array.isArray(questions) && questions.length > 0) {
    const first = questions[0] as Record<string, unknown>;
    if (typeof first?.prompt === 'string') return first.prompt;
    if (typeof first?.question === 'string') return first.question;
  }

  return '';
}
