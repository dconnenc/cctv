import { Block } from '@cctv/types';
import { capitalize } from '@cctv/utils';

import styles from './ViewBlockDetails.module.scss';

export default function ViewBlockDetails({ currentBlock }: { currentBlock?: Block }) {
  if (!currentBlock) {
    return <div>No current block</div>;
  }

  return (
    <div className={styles.viewBlockDetails}>
      <div>Kind: {capitalize(currentBlock?.kind)}</div>
      <div>Responses: {currentBlock?.responses?.total}</div>
      <div>Status: {capitalize(currentBlock?.status)}</div>
      {currentBlock?.visible_to_roles?.length && (
        <div>Visible to roles: {currentBlock?.visible_to_roles?.join(', ')}</div>
      )}
      {currentBlock?.visible_to_segments?.length && (
        <div>Visible to segments: {currentBlock?.visible_to_segments?.join(', ')}</div>
      )}
      {currentBlock?.target_user_ids?.length && (
        <div>Target user IDs: {currentBlock?.target_user_ids?.join(', ')}</div>
      )}
    </div>
  );
}
