import styles from './SegmentBadge.module.scss';

interface SegmentBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
}

export function SegmentBadge({ name, color, onRemove }: SegmentBadgeProps) {
  return (
    <span className={styles.badge} style={{ backgroundColor: color }}>
      {name}
      {onRemove && (
        <button className={styles.removeBtn} onClick={onRemove} aria-label={`Remove ${name}`}>
          &times;
        </button>
      )}
    </span>
  );
}
