import { useMemo } from 'react';

import { Dropdown } from '@cctv/core';
import { Experience } from '@cctv/types';

import SectionHeader from '../SectionHeader/SectionHeader';
import ViewBlockDetails from '../ViewBlockDetails/ViewBlockDetails';
import ViewUserScreen from '../ViewUserScreen/ViewUserScreen';

import styles from './ViewAudienceSection.module.scss';

export default function ViewAudienceSection({
  className,
  experience,
  participantId,
  setSelectedParticipantId,
}: {
  className: string;
  experience?: Experience;
  participantId?: string;
  setSelectedParticipantId: (participantId: string) => void;
}) {
  const participant = useMemo(() => {
    if (!participantId) {
      return undefined;
    }

    return experience?.participants.find((p) => p.id === participantId);
  }, [experience, participantId]);

  const { currentBlock, nextBlock } = useMemo(() => {
    if (!experience) {
      return { currentBlock: undefined, nextBlock: undefined };
    }

    const sortedBlocksByCreatedAt = experience.blocks.sort(
      (a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime(),
    );

    const currentBlockIndex = sortedBlocksByCreatedAt.findIndex((block) => block.status === 'open');
    const nextBlockIndex = currentBlockIndex + 1;

    const currentBlock = sortedBlocksByCreatedAt.at(currentBlockIndex);
    const nextBlock = sortedBlocksByCreatedAt.at(nextBlockIndex);

    return { currentBlock, nextBlock };
  }, [experience]);

  if (!experience) {
    return <div>No experience found</div>;
  }

  return (
    <div className={className}>
      <div className={styles.viewNextBlock}>
        <SectionHeader title="Next view" />
        <ViewUserScreen className={styles.screen} block={nextBlock} participant={participant} />
      </div>
      <div className={styles.viewDetails}>
        <SectionHeader title="Experience Details" />
        <ViewBlockDetails currentBlock={currentBlock} />
        <Dropdown
          options={experience.participants.map((p) => ({ label: p.name, value: p.id }))}
          value={participantId}
          onChange={setSelectedParticipantId}
          label="Viewing as"
        />
      </div>
      <div className={styles.viewCurrentBlock}>
        <SectionHeader title="Current view" />
        <ViewUserScreen className={styles.screen} block={currentBlock} participant={participant} />
      </div>
    </div>
  );
}
