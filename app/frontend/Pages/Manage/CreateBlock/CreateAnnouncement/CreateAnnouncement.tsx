import { TextInput } from '@cctv/core/TextInput/TextInput';
import { BlockKind, BlockStatus, ParticipantSummary } from '@cctv/types';
import { AnnouncementApiPayload, AnnouncementData, BlockComponentProps } from '@cctv/types';

import sharedStyles from '../CreateBlock.module.scss';
import styles from './CreateAnnouncement.module.scss';

export const getDefaultAnnouncementState = (): AnnouncementData => {
  return {
    message: '',
    show_on_monitor: true,
  };
};

export const validateAnnouncement = (data: AnnouncementData): string | null => {
  if (!data.message.trim()) {
    return 'Announcement message is required';
  }

  return null;
};

export const buildAnnouncementPayload = (data: AnnouncementData): AnnouncementApiPayload => {
  return {
    type: BlockKind.ANNOUNCEMENT,
    message: data.message.trim(),
    show_on_monitor: data.show_on_monitor,
  };
};

export const canAnnouncementOpenImmediately = (
  _data: AnnouncementData,
  _participants: ParticipantSummary[],
): boolean => {
  return true;
};

export const processAnnouncementBeforeSubmit = (
  data: AnnouncementData,
  _status: BlockStatus,
  _participants: ParticipantSummary[],
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
    <div className={sharedStyles.container}>
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
      <label className={sharedStyles.checkboxLabel}>
        <input
          type="checkbox"
          checked={data.show_on_monitor}
          onChange={(e) => updateData({ show_on_monitor: e.target.checked })}
        />
        Show on monitor
      </label>
    </div>
  );
}
