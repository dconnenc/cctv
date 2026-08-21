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
  switch (block.kind) {
    case BlockKind.POLL:
    case BlockKind.QUESTION:
      return block.payload.question.trim();
    case BlockKind.ANNOUNCEMENT:
      return block.payload.message.trim();
    case BlockKind.FAMILY_FEUD:
      return block.payload.title.trim();
    case BlockKind.PHOTO_UPLOAD:
      return block.payload.prompt.trim();
    case BlockKind.BUZZER:
      return (block.payload.prompt ?? block.payload.label ?? '').trim();
    case BlockKind.NEWSCASTERS_SOURCE:
      return block.payload.prompt.trim();
    case BlockKind.GUESS_WHO:
    case BlockKind.MINIGAME_ARITHMETIC:
    case BlockKind.MINIGAME_BALLOON_PUMP:
    case BlockKind.THE_SCENE:
    case BlockKind.NEWSCASTERS:
      return '';
    default: {
      const exhaustiveCheck: never = block;
      return exhaustiveCheck;
    }
  }
}
