import { AnnouncementPayload, ParticipantSummary } from '@cctv/types';

import styles from './Announcement.module.scss';

interface AnnouncementProps extends AnnouncementPayload {
  participant?: ParticipantSummary;
}

export default function Announcement({ participant, message }: AnnouncementProps) {
  const processedMessage = participant
    ? message.replace(/\{\{participant_name\}\}/g, participant.name || participant.email)
    : message;

  return (
    <div className={styles.announcement}>
      <div className={styles.content}>
        <p className={styles.message}>{processedMessage}</p>
      </div>
    </div>
  );
}
