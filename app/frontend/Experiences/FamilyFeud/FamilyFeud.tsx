import { FamilyFeudPayload } from '@cctv/types';

import styles from './FamilyFeud.module.scss';

interface FamilyFeudProps extends FamilyFeudPayload {}

export default function FamilyFeud({ title }: FamilyFeudProps) {
  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{title}</h2>
    </div>
  );
}
