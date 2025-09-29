import { Experience } from '@cctv/types';
import { capitalize, fmtDate } from '@cctv/utils';

import styles from './ViewExperienceDetails.module.scss';

export default function ViewExperienceDetails({
  experience,
  isPolling,
}: {
  experience?: Experience;
  isPolling: boolean;
}) {
  if (!experience) {
    return <div>No experience found</div>;
  }

  return (
    <div className={styles.viewExperienceDetails}>
      <div>Code: {experience.code}</div>
      <div>Status: {capitalize(experience.status)}</div>
      <div>Polling: {isPolling ? 'Yes' : 'No'}</div>
      <div>Created: {fmtDate(experience.created_at)}</div>
      <div>Updated: {fmtDate(experience.updated_at)}</div>
    </div>
  );
}
