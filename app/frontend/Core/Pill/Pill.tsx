import styles from './Pill.module.scss';

export function Pill({ label }: { label: string }) {
  return <span className={styles.pill}>{label}</span>;
}
