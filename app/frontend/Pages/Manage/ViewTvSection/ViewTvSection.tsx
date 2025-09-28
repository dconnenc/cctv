import { useMemo } from 'react';

import { Dropdown } from '@cctv/core';
import { Block, Experience } from '@cctv/types';

import SectionHeader from '../SectionHeader/SectionHeader';
import ViewBlockDetails from '../ViewBlockDetails/ViewBlockDetails';

import styles from './ViewTvSection.module.scss';

export default function ViewTvSection({
  className,
  experience,
  participantId,
  setSelectedParticipantId,
}: {
  className?: string;
  experience?: Experience;
  participantId?: string;
  setSelectedParticipantId: (participantId: string) => void;
}) {
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

  return (
    <div className={className}>
      <div className={styles.viewNextBlock}>
        <SectionHeader title="Next view" />
        <ViewTvScreen block={nextBlock} className={styles.screen} />
      </div>
      <div className={styles.viewDetails}>
        <SectionHeader title="Experience Details" />
        <ViewBlockDetails currentBlock={currentBlock} />
        <Dropdown
          options={experience?.participants.map((p) => ({ label: p.name, value: p.id })) ?? []}
          value={participantId}
          onChange={setSelectedParticipantId}
          label="Viewing as"
        />
      </div>
      <div className={styles.viewCurrentBlock}>
        <SectionHeader title="Current view" />
        <ViewTvScreen block={currentBlock} className={styles.screen} />
      </div>
    </div>
  );
}

function ViewTvScreen({ className, block }: { className: string; block?: Block }) {
  if (!block) {
    return <div>No block found</div>;
  }

  return <div className={className}>TV Screen for: {block.kind}</div>;
}
