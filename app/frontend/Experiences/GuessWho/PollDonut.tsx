import styles from './GuessWho.module.scss';

interface PollDonutProps {
  responded: number;
  total: number;
  size?: number;
}

export default function PollDonut({ responded, total, size = 220 }: PollDonutProps) {
  const pct = total > 0 ? Math.min(100, Math.round((responded / total) * 100)) : 0;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={styles.donutWrap} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.4s ease-out' }}
        />
      </svg>
      <div className={styles.donutLabel}>
        <span className={styles.donutPct}>{pct}%</span>
        <span className={styles.donutCount}>
          {responded} / {total}
        </span>
      </div>
    </div>
  );
}
