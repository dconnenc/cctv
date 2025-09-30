import { TextInput } from '@cctv/core';

import { AnnouncementData, BlockComponentProps } from '../types';

import styles from './CreateAnnouncement.module.scss';

export default function CreateAnnouncement({
  data,
  onChange,
}: BlockComponentProps<AnnouncementData>) {
  const updateData = (updates: Partial<AnnouncementData>) => {
    onChange?.(updates);
  };
  return (
    <div className={styles.details}>
      <div className={styles.center}>
        <TextInput
          label="Announcement Message"
          placeholder="Dearest {{ participant_name }}, this is your announcement."
          required
          value={data.message}
          onChange={(e) => updateData({ message: e.target.value })}
        />
        <span className={styles.helpText}>
          {`Include the participant's name with {{ participant_name }}`}
        </span>
      </div>
    </div>
  );
}
