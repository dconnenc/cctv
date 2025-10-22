import { Panel } from '@cctv/core';

import styles from './UpNextPanel.module.scss';

export default function UpNextPanel() {
  return (
    <Panel title="Up Next">
      <div className={styles.preview}>
        <div className={styles.emptyState}>No block for viewing context</div>
      </div>
    </Panel>
  );
}
