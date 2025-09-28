import { PropsWithChildren } from 'react';

import styles from './SectionHeader.module.scss';

interface SectionHeaderProps extends PropsWithChildren {
  title: string;
}

export default function SectionHeader({ title, children }: SectionHeaderProps) {
  return (
    <div className={styles.headerRow}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <div className={styles.headerActions}>{children}</div>
    </div>
  );
}
