import { TextInput } from '@cctv/core';
import { BlockStatus, ParticipantSummary } from '@cctv/types';

import { AnnouncementData, BlockComponentProps } from '../types';

import styles from './CreateAnnouncement.module.scss';

// Pure functions for announcement business logic
export const getDefaultAnnouncementState = (): AnnouncementData => {
  return {
    message: '',
  };
};

export const validateAnnouncement = (data: AnnouncementData): string | null => {
  if (!data.message.trim()) {
    return 'Announcement message is required';
  }

  return null;
};

export const buildAnnouncementPayload = (data: AnnouncementData): Record<string, any> => {
  return {
    type: 'announcement',
    message: data.message.trim(),
  };
};

export const canAnnouncementOpenImmediately = (
  data: AnnouncementData,
  participants: ParticipantSummary[],
): boolean => {
  return true;
};

export const processAnnouncementBeforeSubmit = (
  data: AnnouncementData,
  status: BlockStatus,
  participants: ParticipantSummary[],
): AnnouncementData => {
  return data;
};

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
