import { PropsWithChildren, ReactNode } from 'react';

import styles from './Panel.module.scss';

interface PanelProps extends PropsWithChildren {
  title?: string;
  headerContent?: ReactNode;
  className?: string;
}

export const Panel = ({ title, headerContent, children, className }: PanelProps) => {
  return (
    <div className={`${styles.panel} ${className || ''}`}>
      {(title || headerContent) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {headerContent}
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
};
