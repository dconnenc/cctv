import { AnnouncementPayload, ParticipantSummary } from '@cctv/types';
import { renderNameTemplate } from '@cctv/utils';

import styles from './Announcement.module.scss';

interface AnnouncementProps extends AnnouncementPayload {
  participant?: ParticipantSummary;
}

export default function Announcement({ participant, message }: AnnouncementProps) {
  return (
    <div className={styles.announcement}>
      <p className={styles.message}>{renderNameTemplate(message, participant)}</p>
    </div>
  );
}
