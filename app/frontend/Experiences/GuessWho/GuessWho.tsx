import { Layer, Line, Stage } from 'react-konva';

import { GuessWhoPayload, GuessWhoSlide, GuessWhoUserSummary } from '@cctv/types';

import styles from './GuessWho.module.scss';

const AVATAR_SIZE = 192;
const AVATAR_SCALE = AVATAR_SIZE / 400;

interface GuessWhoProps {
  payload: GuessWhoPayload;
}

function slotLabel(slot: 'a' | 'b'): string {
  return slot === 'a' ? 'Person 1' : 'Person 2';
}

function blockKindLabel(kind: string): string {
  return kind.replace(/_/g, ' ');
}

function renderAvatar(summary: GuessWhoUserSummary | null | undefined) {
  const strokes = summary?.avatar?.strokes ?? [];
  if (strokes.length === 0) {
    return <div className={styles.avatarPlaceholder} aria-hidden />;
  }
  return (
    <div className={styles.avatarWrap}>
      <Stage width={AVATAR_SIZE} height={AVATAR_SIZE}>
        <Layer scaleX={AVATAR_SCALE} scaleY={AVATAR_SCALE}>
          {strokes.map((s, i) => (
            <Line
              key={i}
              points={s.points}
              stroke={s.color}
              strokeWidth={s.width}
              lineCap="round"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

function SlideView({
  slide,
  total,
  index,
}: {
  slide: GuessWhoSlide;
  total: number;
  index: number;
}) {
  const answerText = slide.answer?.text;
  const photoUrl = slide.photo_url;

  return (
    <div className={styles.slide}>
      <div className={styles.meta}>
        <span className={styles.slot}>{slotLabel(slide.slot)}</span>
        <span className={styles.kind}>{blockKindLabel(slide.block_kind)}</span>
        <span className={styles.counter}>
          {index + 1} / {total}
        </span>
      </div>

      <div className={styles.prompt}>{slide.prompt || 'Submission'}</div>

      <div className={styles.answer}>
        {photoUrl ? (
          <img src={photoUrl} alt="Submission" className={styles.photo} />
        ) : (
          <p className={styles.answerText}>{answerText || '—'}</p>
        )}
      </div>
    </div>
  );
}

function RevealView({
  user,
  slot,
}: {
  user: GuessWhoUserSummary | null | undefined;
  slot: 'a' | 'b';
}) {
  return (
    <div className={styles.revealCard}>
      <div className={styles.revealLabel}>{slotLabel(slot)}</div>
      {renderAvatar(user)}
      <div className={styles.revealName}>{user?.name || 'Unknown'}</div>
    </div>
  );
}

export default function GuessWho({ payload }: GuessWhoProps) {
  const slides = payload.slides ?? [];
  const index = Math.min(
    Math.max(payload.current_slide_index ?? 0, 0),
    Math.max(slides.length - 1, 0),
  );
  const slide = slides[index];

  if (payload.error) {
    return (
      <div className={styles.root}>
        <p className={styles.empty}>{payload.error}</p>
      </div>
    );
  }

  if (payload.revealed) {
    return (
      <div className={styles.root}>
        <h2 className={styles.title}>Who were they?</h2>
        <div className={styles.revealRow}>
          <RevealView user={payload.user_a} slot="a" />
          <RevealView user={payload.user_b} slot="b" />
        </div>
      </div>
    );
  }

  if (!slide) {
    return (
      <div className={styles.root}>
        <p className={styles.empty}>No submissions to show.</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>Guess Who?</h2>
      <SlideView slide={slide} total={slides.length} index={index} />
    </div>
  );
}
