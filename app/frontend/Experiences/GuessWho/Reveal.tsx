import { GuessWhoContestant } from '@cctv/types';

import Avatar from './Avatar';

import styles from './GuessWho.module.scss';

interface RevealProps {
  contestants: GuessWhoContestant[];
}

function Fireworks() {
  const burstCount = 12;
  return (
    <div className={styles.fireworks} aria-hidden>
      {Array.from({ length: burstCount }).map((_, i) => (
        <span
          key={i}
          className={styles.fireworkBurst}
          style={{
            left: `${(i * 83) % 100}%`,
            top: `${(i * 47) % 80}%`,
            animationDelay: `${(i % 6) * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

function ContestantCard({ contestant }: { contestant: GuessWhoContestant }) {
  const visibleClues = contestant.clues.filter((c) => !c.hidden);

  return (
    <div className={styles.revealCard}>
      <div className={styles.revealLabel}>The mystery participant was…</div>
      <Avatar strokes={contestant.mystery?.avatar?.strokes ?? null} size={192} />
      <div className={styles.revealName}>{contestant.mystery?.name ?? 'Unknown'}</div>
      <div className={styles.revealCrawl}>
        <div className={styles.crawlInner}>
          {visibleClues.map((clue) => (
            <div key={clue.id} className={styles.crawlEntry}>
              <span className={styles.crawlPrompt}>{clue.prompt || 'Submission'}</span>
              <span className={styles.crawlAnswer}>{clue.answer?.text || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Reveal({ contestants }: RevealProps) {
  return (
    <div className={styles.revealRoot}>
      <Fireworks />
      <h2 className={styles.title}>The Reveal</h2>
      <div className={styles.revealRow}>
        {contestants.map((c, i) => (
          <ContestantCard key={i} contestant={c} />
        ))}
      </div>
    </div>
  );
}
