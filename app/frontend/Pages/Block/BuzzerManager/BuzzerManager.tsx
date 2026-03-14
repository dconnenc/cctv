import { DialogDescription, DialogTitle } from '@cctv/components/ui/dialog';
import { Button } from '@cctv/core/Button/Button';
import { useClearBuzzerResponses } from '@cctv/hooks/useClearBuzzerResponses';
import { BuzzerBlock, ExperienceParticipant } from '@cctv/types';

import styles from './BuzzerManager.module.scss';

interface BuzzerManagerProps {
  block: BuzzerBlock;
  participants: ExperienceParticipant[];
}

export default function BuzzerManager({ block, participants }: BuzzerManagerProps) {
  const { clearBuzzerResponses, isLoading } = useClearBuzzerResponses();

  const allResponses = block.responses?.all_responses ?? [];
  const allParticipants = participants;

  const nameForUserId = (userId: string): string => {
    return allParticipants.find((p) => p.user_id === userId)?.name ?? 'Unknown';
  };

  return (
    <div className={styles.root}>
      <DialogTitle className={styles.title}>Buzzer</DialogTitle>
      <DialogDescription className="sr-only">Manage buzzer responses</DialogDescription>

      <div className={styles.summary}>
        <span className={styles.count}>{allResponses.length}</span>
        <span className={styles.countLabel}>{allResponses.length === 1 ? 'buzz' : 'buzzes'}</span>
      </div>

      {allResponses.length > 0 ? (
        <ol className={styles.list}>
          {allResponses.map((response, index) => (
            <li key={response.id} className={styles.listItem}>
              <span className={styles.position}>{index + 1}</span>
              <span className={styles.name}>{nameForUserId(response.user_id)}</span>
              <span className={styles.time}>
                {new Date(response.answer.buzzed_at).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.empty}>No one has buzzed in yet.</p>
      )}

      <Button
        variant="secondary"
        onClick={() => clearBuzzerResponses(block.id)}
        loading={isLoading}
        loadingText="Resetting…"
        disabled={allResponses.length === 0}
      >
        Reset Buzzers
      </Button>
    </div>
  );
}
