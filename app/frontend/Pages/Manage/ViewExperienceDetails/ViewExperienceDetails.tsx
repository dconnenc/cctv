import { Experience } from '@cctv/types';
import { fmtDate } from '@cctv/utils';

import styles from './ViewExperienceDetails.module.scss';

export default function ViewExperienceDetails({ experience }: { experience?: Experience }) {
  if (!experience) {
    return <div>No experience found</div>;
  }

  return (
    <div className={styles.viewExperienceDetails}>
      <div>Code: {experience.code}</div>
      <div>Status: {experience.status}</div>
      <div>Created: {fmtDate(experience.created_at)}</div>
      <div>Updated: {fmtDate(experience.updated_at)}</div>
    </div>
  );
}
