import { AnnouncementPayload, ParticipantSummary } from '@cctv/types';

import styles from './Announcement.module.scss';

interface AnnouncementProps extends AnnouncementPayload {
  participant?: ParticipantSummary;
}

export default function Announcement({ participant, message }: AnnouncementProps) {
  const processedMessage = participant
    ? message.replace(/\{\{\s*participant_name\s*\}\}/g, participant.name || participant.email)
    : message;

  return (
    <div className={styles.announcement}>
      <p className={styles.message}>{processedMessage}</p>
    </div>
  );
}
