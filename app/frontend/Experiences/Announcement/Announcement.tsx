import { AnnouncementBlock, ParticipantSummary } from '@cctv/types';

import styles from './Announcement.module.scss';

interface AnnouncementProps extends AnnouncementBlock {
  participant: ParticipantSummary;
}

export default function Announcement({ participant, message }: AnnouncementProps) {
  // Basic templating to replace {{participant_name}} with actual name
  const processedMessage = message.replace(
    /\{\{participant_name\}\}/g,
    participant.name || participant.email,
  );

  return (
    <div className={styles.announcement}>
      <div className={styles.content}>
        <p className={styles.message}>{processedMessage}</p>
      </div>
    </div>
  );
}
