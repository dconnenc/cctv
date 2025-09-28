import classNames from 'classnames';

import { ExperienceBlockContainer } from '@cctv/experiences';
import { Block, ParticipantSummary } from '@cctv/types';

import styles from './ViewUserScreen.module.scss';

export default function ViewUserScreen({
  className,
  block,
  participant,
}: {
  className?: string;
  block?: Block;
  participant?: ParticipantSummary;
}) {
  if (!block) {
    return <div>No open block found</div>;
  }

  return (
    <div className={classNames(styles.root, className)}>
      <ExperienceBlockContainer block={block} participant={participant} disabled />
    </div>
  );
}
