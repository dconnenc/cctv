import classNames from 'classnames';

import { ExperienceBlockContainer } from '@cctv/experiences';
import { Experience } from '@cctv/types';

import styles from './ViewUserScreen.module.scss';

export default function ViewUserScreen({
  className,
  experience,
}: {
  className?: string;
  experience?: Experience;
}) {
  if (!experience) {
    return <div>No experience found</div>;
  }

  const firstOpenBlock = experience.blocks.findIndex((block) => block.status === 'open');

  if (firstOpenBlock === -1) {
    return <div>No open block found</div>;
  }

  return (
    <div className={classNames(styles.root, className)}>
      <ExperienceBlockContainer
        block={experience.blocks[firstOpenBlock]}
        participant={experience.participants[0]}
        disabled
      />
    </div>
  );
}
