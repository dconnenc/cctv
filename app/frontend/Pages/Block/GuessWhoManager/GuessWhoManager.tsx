import { DialogDescription, DialogTitle } from '@cctv/core';
import { Button } from '@cctv/core/Button/Button';
import { useGuessWhoControls } from '@cctv/hooks/useGuessWhoControls';
import { GuessWhoBlock } from '@cctv/types';

import styles from './GuessWhoManager.module.scss';

interface GuessWhoManagerProps {
  block: GuessWhoBlock;
}

export default function GuessWhoManager({ block }: GuessWhoManagerProps) {
  const { nextSlide, previousSlide, reveal, isLoading } = useGuessWhoControls();

  const slides = block.payload.slides ?? [];
  const total = slides.length;
  const index = block.payload.current_slide_index ?? 0;
  const revealed = block.payload.revealed === true;
  const error = block.payload.error;
  const userA = block.payload.user_a;
  const userB = block.payload.user_b;

  const atStart = index <= 0;
  const atEnd = total === 0 || index >= total - 1;

  const slide = slides[index];

  return (
    <div className={styles.root}>
      <DialogTitle className={styles.title}>Guess Who</DialogTitle>
      <DialogDescription className="sr-only">
        Step through Guess Who slides and reveal the audience members
      </DialogDescription>

      {error && <p className={styles.error}>{error}</p>}

      {!error && total === 0 && (
        <p className={styles.empty}>
          Open this block to randomly select participants and build the slide deck.
        </p>
      )}

      {!error && total > 0 && (
        <>
          <div className={styles.identities}>
            <div className={styles.identity}>
              <span className={styles.identityLabel}>Person 1</span>
              <span className={styles.identityName}>{userA?.name || '—'}</span>
            </div>
            <div className={styles.identity}>
              <span className={styles.identityLabel}>Person 2</span>
              <span className={styles.identityName}>{userB?.name || '—'}</span>
            </div>
          </div>

          <div className={styles.progress}>
            Slide {Math.min(index + 1, total)} of {total}
            {revealed && <span className={styles.revealed}> · Revealed</span>}
          </div>

          {slide && (
            <div className={styles.preview}>
              <div className={styles.previewMeta}>
                <span>{slide.slot === 'a' ? 'Person 1' : 'Person 2'}</span>
                <span>{slide.block_kind.replace(/_/g, ' ')}</span>
              </div>
              <div className={styles.previewPrompt}>{slide.prompt || 'Submission'}</div>
              <div className={styles.previewAnswer}>
                {slide.photo_url ? (
                  <img src={slide.photo_url} alt="Submission" className={styles.previewPhoto} />
                ) : (
                  slide.answer?.text || '—'
                )}
              </div>
            </div>
          )}

          <div className={styles.controls}>
            <Button
              variant="secondary"
              onClick={() => previousSlide(block.id)}
              disabled={atStart || isLoading}
            >
              ← Previous
            </Button>
            <Button onClick={() => nextSlide(block.id)} disabled={atEnd || isLoading}>
              Next →
            </Button>
            <Button
              variant="secondary"
              onClick={() => reveal(block.id)}
              disabled={revealed || isLoading}
            >
              {revealed ? 'Revealed' : 'Reveal'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
