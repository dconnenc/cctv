import { useNavigate } from 'react-router-dom';

import { useExperience } from '@cctv/contexts';
import { useChangeBlockStatus } from '@cctv/hooks';
import { BlockStatus, ParticipantSummary } from '@cctv/types';

import CreateBlock from '../Manage/CreateBlock/CreateBlock';

import styles from './ManageCreateBlock.module.scss';

export default function ManageCreateBlock() {
  const { experience, code, refetchExperience } = useExperience();
  const navigate = useNavigate();

  const { change: changeStatus } = useChangeBlockStatus();

  const participantsCombined: ParticipantSummary[] = [
    ...(experience?.hosts || []),
    ...(experience?.participants || []),
  ];

  const currentBlock = experience?.blocks.find((block) => block.status === 'open');

  const handleClose = () => {
    navigate(`/experiences/${code}/manage`);
  };

  const handleEndCurrentBlock = async () => {
    if (!currentBlock) return;
    await changeStatus(currentBlock, 'closed');
  };

  return (
    <section className={styles.root}>
      <div className={styles.container}>
        <CreateBlock
          refetchExperience={refetchExperience}
          onClose={handleClose}
          participants={participantsCombined}
          onEndCurrentBlock={handleEndCurrentBlock}
        />
      </div>
    </section>
  );
}
