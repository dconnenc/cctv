import classNames from 'classnames';

import ExperienceBlockContainer from '@cctv/experiences/ExperienceBlockContainer/ExperienceBlockContainer';
import { Block, ParticipantSummary } from '@cctv/types';

import styles from './BlockPreview.module.scss';

export default function BlockPreview({
  className,
  block,
  participant,
  viewContext = 'manage',
}: {
  className?: string;
  block?: Block;
  participant?: ParticipantSummary;
  viewContext?: 'participant' | 'monitor' | 'manage';
}) {
  if (!block) {
    return <div>No open block found</div>;
  }

  return (
    <div className={classNames(styles.root, className)}>
      <ExperienceBlockContainer
        block={block}
        participant={participant}
        disabled
        viewContext={viewContext}
      />
    </div>
  );
}
