import { Link } from 'react-router-dom';

import { Button } from '@cctv/core/Button/Button';

import styles from './AdminNotification.module.scss';

interface AdminNotificationProps {
  code: string;
}

export default function AdminNotification({ code }: AdminNotificationProps) {
  return (
    <div className={styles.adminNotification}>
      <p className={styles.adminMessage}>
        You're viewing this experience as an admin but aren't registered as a participant.
      </p>
      <div className={styles.adminActions}>
        <Link to={`/experiences/${code}/register`}>
          <Button>Register to Participate</Button>
        </Link>
        <Link to={`/experiences/${code}/manage`}>
          <Button className={styles.ghostButton}>Manage Experience</Button>
        </Link>
      </div>
    </div>
  );
}
