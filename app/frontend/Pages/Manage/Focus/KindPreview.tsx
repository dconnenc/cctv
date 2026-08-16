import classNames from 'classnames';

import { BlockKind } from '@cctv/types';

import styles from './KindPreview.module.scss';

interface KindPreviewProps {
  kind: BlockKind;
  className?: string;
}

function Bars({ widths, filled }: { widths: string[]; filled: number }) {
  return (
    <div className={styles.barRow}>
      {widths.map((width, index) => (
        <div
          key={width}
          className={classNames(styles.bar, index === filled && styles.barFilled)}
          style={{ width }}
        />
      ))}
    </div>
  );
}

function Lines({ widths }: { widths: string[] }) {
  return (
    <div className={styles.barRow}>
      {widths.map((width) => (
        <div key={width} className={styles.line} style={{ width }} />
      ))}
    </div>
  );
}

export default function KindPreview({ kind, className }: KindPreviewProps) {
  return (
    <div className={classNames(styles.root, className)} aria-hidden="true">
      {renderPreview(kind)}
    </div>
  );
}

function renderPreview(kind: BlockKind) {
  switch (kind) {
    case BlockKind.POLL:
      return (
        <>
          <div className={styles.headline} />
          <Bars widths={['85%', '60%', '40%']} filled={0} />
        </>
      );
    case BlockKind.QUESTION:
      return (
        <>
          <div className={styles.headline} />
          <div className={styles.caret} />
        </>
      );
    case BlockKind.ANNOUNCEMENT:
      return (
        <>
          <div className={styles.headline} />
          <Lines widths={['90%', '70%']} />
        </>
      );
    case BlockKind.FAMILY_FEUD:
      return (
        <div className={styles.board}>
          <div className={classNames(styles.cell, styles.cellRevealed)} />
          <div className={styles.cell} />
          <div className={styles.cell} />
          <div className={classNames(styles.cell, styles.cellRevealed)} />
          <div className={styles.cell} />
          <div className={styles.cell} />
        </div>
      );
    case BlockKind.PHOTO_UPLOAD:
      return (
        <div className={styles.frames}>
          <div className={styles.frame} />
          <div className={styles.frame} />
          <div className={styles.frame} />
        </div>
      );
    case BlockKind.BUZZER:
      return <div className={styles.buzzer} />;
    case BlockKind.GUESS_WHO:
      return (
        <div className={styles.silhouette}>
          <div className={styles.head} />
          <div className={classNames(styles.head, styles.headActive)} />
          <div className={styles.head} />
        </div>
      );
    case BlockKind.MINIGAME_ARITHMETIC:
      return <div className={styles.glyph}>7 + 4</div>;
    case BlockKind.MINIGAME_BALLOON_PUMP:
      return (
        <div className={styles.row}>
          <div className={classNames(styles.balloon, styles.balloonSmall)} />
          <div className={styles.balloon} />
          <div className={classNames(styles.balloon, styles.balloonSmall)} />
        </div>
      );
    case BlockKind.THE_SCENE:
      return (
        <>
          <div className={styles.spotlight} />
          <Lines widths={['55%']} />
        </>
      );
    default: {
      const exhaustiveCheck: never = kind;
      return <div className={styles.glyph}>{exhaustiveCheck}</div>;
    }
  }
}
