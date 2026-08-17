import { GuessWhoContestant } from '@cctv/types';

import Avatar from './Avatar';

import styles from './GuessWho.module.scss';

interface RevealProps {
  contestants: GuessWhoContestant[];
}

const FIREWORK_BURSTS = Array.from({ length: 12 }, (_, position) => ({
  id: `burst-${position}`,
  left: `${(position * 83) % 100}%`,
  top: `${(position * 47) % 80}%`,
  animationDelay: `${(position % 6) * 0.18}s`,
}));

function Fireworks() {
  return (
    <div className={styles.fireworks} aria-hidden>
      {FIREWORK_BURSTS.map((burst) => (
        <span
          key={burst.id}
          className={styles.fireworkBurst}
          style={{ left: burst.left, top: burst.top, animationDelay: burst.animationDelay }}
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
      <Avatar avatar={contestant.mystery?.avatar} size={192} />
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
        {contestants.map((c) => (
          <ContestantCard key={c.contestant_user_id ?? 'unassigned'} contestant={c} />
        ))}
      </div>
    </div>
  );
}
